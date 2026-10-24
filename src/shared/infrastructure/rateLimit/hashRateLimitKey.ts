import { createHash } from 'crypto';

/** Rate-limit rows never store raw emails or IPs, only a peppered hash. */
export const hashRateLimitKey = (scope: string, value: string): string => {
    const pepper = process.env.MAGIC_LINK_PEPPER ?? '';
    const digest = createHash('sha256')
        .update(`${scope}:${value}${pepper}`)
        .digest('hex');

    return `${scope}#${digest}`;
};
