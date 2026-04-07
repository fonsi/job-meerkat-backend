import { MagicLinkPurpose, MagicLinkSubject } from 'magicLink/domain/magicLink';
import { MagicLinkRepository } from 'magicLink/domain/magicLinkRepository';
import { hashMagicLinkToken } from './hashToken';

export type VerifyMagicLinkInput = {
    token: string;
    purpose: MagicLinkPurpose;
    repository: MagicLinkRepository;
};

export type VerifyMagicLinkResult = {
    subject: MagicLinkSubject;
    email: string;
};

export const verifyMagicLink = async ({
    token,
    purpose,
    repository,
}: VerifyMagicLinkInput): Promise<VerifyMagicLinkResult | null> => {
    const tokenHash = hashMagicLinkToken(token);
    const row = await repository.getByTokenHash(tokenHash);

    if (!row || row.purpose !== purpose) {
        return null;
    }

    if (row.expiresAt <= Date.now()) {
        return null;
    }

    return { subject: row.subject, email: row.email };
};
