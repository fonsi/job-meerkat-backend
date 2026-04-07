import { createHash } from 'crypto';

export const hashMagicLinkToken = (token: string): string => {
    const pepper = process.env.MAGIC_LINK_PEPPER ?? '';
    return createHash('sha256')
        .update(token + pepper)
        .digest('hex');
};
