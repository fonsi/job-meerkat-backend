import {
    sendConfirmLinkForReport,
    sendPreferencesLinkForReport,
} from 'newsletter/infrastructure/email/sendNewsletterEmails';
import {
    buildConfirmUrl,
    buildSettingsUrl,
} from 'newsletter/infrastructure/url/buildNewsletterUrls';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { dynamodbRateLimitStore } from 'shared/infrastructure/rateLimit/dynamodbRateLimitStore';
import { RateLimitStore } from 'shared/infrastructure/rateLimit/rateLimitStore';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';
import { generateOpaqueToken } from 'shared/infrastructure/token/generateOpaqueToken';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { parseSubscribeRequest } from './parseSubscribeRequest';
import {
    SubscribeBlockReason,
    checkSubscribeBotSignals,
    checkSubscribeRateLimit,
} from './subscribeProtection';

export type SubscribeNewsletterEvent = {
    body?: string | null;
    requestContext?: {
        http?: { sourceIp?: string };
        identity?: { sourceIp?: string };
    };
};

/**
 * The HTTP response is always `{ ok: true }` so callers can't probe which
 * emails exist or whether they were blocked. `outcome` is for logs and tests.
 */
export type SubscribeNewsletterResult = {
    ok: true;
    outcome: 'invalid' | 'sent' | SubscribeBlockReason;
};

const sourceIpOf = (event: SubscribeNewsletterEvent): string | undefined =>
    event.requestContext?.http?.sourceIp ||
    event.requestContext?.identity?.sourceIp ||
    undefined;

export const subscribeNewsletter = async (
    event: SubscribeNewsletterEvent,
    { rateLimitStore = dynamodbRateLimitStore as RateLimitStore } = {},
): Promise<SubscribeNewsletterResult> => {
    const request = parseSubscribeRequest(event.body);
    if (!request.email) {
        return { ok: true, outcome: 'invalid' };
    }

    const botSignals = checkSubscribeBotSignals(request);
    if (botSignals.allowed === false) {
        return { ok: true, outcome: botSignals.reason };
    }

    const raw = request.email;
    const email = normalizeEmail(raw);

    const rateLimit = await checkSubscribeRateLimit({
        emailNormalized: email,
        sourceIp: sourceIpOf(event),
        store: rateLimitStore,
        onStoreError: (e) => {
            console.error('[NEWSLETTER SUBSCRIBE] rate limit store failed', e);
            logger?.error(
                errorWithPrefix(
                    e instanceof Error ? e : new Error(String(e)),
                    'newsletter rate limit',
                ),
            );
        },
    });
    if (rateLimit.allowed === false) {
        return { ok: true, outcome: rateLimit.reason };
    }

    const existing = await reportRepository.getByEmailNormalized(email);

    if (!existing) {
        const report = await reportRepository.createPending({
            email: raw,
            emailNormalized: email,
            unsubscribeToken: generateOpaqueToken(),
        });
        await sendConfirmLinkForReport(report, buildConfirmUrl);
        return { ok: true, outcome: 'sent' };
    }

    if (existing.status === 'pending') {
        await sendConfirmLinkForReport(existing, buildConfirmUrl);
        return { ok: true, outcome: 'sent' };
    }

    if (existing.status === 'active') {
        await sendPreferencesLinkForReport(existing, buildSettingsUrl);
        return { ok: true, outcome: 'sent' };
    }

    const report = await reportRepository.resetToPending(
        existing.id,
        generateOpaqueToken(),
    );
    await sendConfirmLinkForReport(report, buildConfirmUrl);

    return { ok: true, outcome: 'sent' };
};
