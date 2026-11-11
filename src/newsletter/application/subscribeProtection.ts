import { hashRateLimitKey } from 'shared/infrastructure/rateLimit/hashRateLimitKey';
import { RateLimitStore } from 'shared/infrastructure/rateLimit/rateLimitStore';
import { SubscribeRequest } from './parseSubscribeRequest';

const MINUTE_MS = 60 * 1000;

/**
 * Same address within this window does not trigger another email.
 * Bot bursts post the same address 3-4 times about 5 s apart.
 */
export const SUBSCRIBE_EMAIL_COOLDOWN_MS = 5 * MINUTE_MS;
/** Subscribe requests accepted per IP per fixed window. */
export const SUBSCRIBE_IP_LIMIT = 5;
export const SUBSCRIBE_IP_WINDOW_MS = 60 * MINUTE_MS;

export type SubscribeBlockReason =
    | 'honeypot'
    | 'ip_rate_limited'
    | 'email_cooldown';

export type SubscribeProtectionResult =
    | { allowed: true }
    | { allowed: false; reason: SubscribeBlockReason };

/**
 * Cheap checks on the request itself, before touching DynamoDB.
 * A captcha (e.g. Turnstile siteverify on `request.captchaToken`) belongs here.
 */
export const checkSubscribeBotSignals = (
    request: SubscribeRequest,
): SubscribeProtectionResult => {
    if (request.honeypot) {
        return { allowed: false, reason: 'honeypot' };
    }

    return { allowed: true };
};

export const checkSubscribeRateLimit = async ({
    emailNormalized,
    sourceIp,
    store,
    now = Date.now(),
    onStoreError = (e) => console.error('[NEWSLETTER SUBSCRIBE]', e),
}: {
    emailNormalized: string;
    sourceIp?: string;
    store: RateLimitStore;
    now?: number;
    onStoreError?: (e: unknown) => void;
}): Promise<SubscribeProtectionResult> => {
    try {
        if (sourceIp) {
            const hits = await store.hit(
                hashRateLimitKey('nl-sub-ip', sourceIp),
                SUBSCRIBE_IP_WINDOW_MS,
                now,
            );
            if (hits > SUBSCRIBE_IP_LIMIT) {
                return { allowed: false, reason: 'ip_rate_limited' };
            }
        }

        const claimed = await store.claim(
            hashRateLimitKey('nl-sub-email', emailNormalized),
            SUBSCRIBE_EMAIL_COOLDOWN_MS,
            now,
        );
        if (!claimed) {
            return { allowed: false, reason: 'email_cooldown' };
        }
    } catch (e) {
        // Fail open: a rate-limit outage must not block real signups.
        onStoreError(e);
    }

    return { allowed: true };
};
