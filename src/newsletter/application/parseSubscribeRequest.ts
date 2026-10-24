/** Hidden form field real users never see or fill. Bots that fill every input do. */
export const NEWSLETTER_HONEYPOT_FIELD = 'website';

export type SubscribeRequest = {
    email: string | null;
    /** Trimmed honeypot value, `''` when missing or empty. */
    honeypot: string;
    /**
     * Reserved for a future captcha (e.g. Cloudflare Turnstile). Parsed now so
     * the check in `subscribeProtection` can be added without touching parsing.
     */
    captchaToken: string | null;
};

const stringOrNull = (value: unknown): string | null =>
    typeof value === 'string' && value.trim() ? value.trim() : null;

export const parseSubscribeRequest = (
    body: string | null | undefined,
): SubscribeRequest => {
    const empty: SubscribeRequest = {
        email: null,
        honeypot: '',
        captchaToken: null,
    };
    if (!body) {
        return empty;
    }

    try {
        const parsed = JSON.parse(body) as Record<string, unknown> | null;
        if (!parsed || typeof parsed !== 'object') {
            return empty;
        }

        return {
            email: stringOrNull(parsed.email),
            honeypot: stringOrNull(parsed[NEWSLETTER_HONEYPOT_FIELD]) ?? '',
            captchaToken: stringOrNull(parsed.captchaToken),
        };
    } catch {
        return empty;
    }
};
