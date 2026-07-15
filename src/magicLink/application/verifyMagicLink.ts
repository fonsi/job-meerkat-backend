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

export type VerifyMagicLinkError = 'token_invalid' | 'token_expired';

export type VerifyMagicLinkOutcome =
    | { ok: true; result: VerifyMagicLinkResult }
    | { ok: false; reason: VerifyMagicLinkError };

export const verifyMagicLink = async ({
    token,
    purpose,
    repository,
}: VerifyMagicLinkInput): Promise<VerifyMagicLinkResult | null> => {
    const outcome = await verifyMagicLinkWithReason({
        token,
        purpose,
        repository,
    });

    return outcome.ok ? outcome.result : null;
};

export const verifyMagicLinkWithReason = async ({
    token,
    purpose,
    repository,
}: VerifyMagicLinkInput): Promise<VerifyMagicLinkOutcome> => {
    const tokenHash = hashMagicLinkToken(token);
    const row = await repository.getByTokenHash(tokenHash);

    if (!row || row.purpose !== purpose) {
        return { ok: false, reason: 'token_invalid' };
    }

    if (row.expiresAt <= Date.now()) {
        return { ok: false, reason: 'token_expired' };
    }

    return { ok: true, result: { subject: row.subject, email: row.email } };
};
