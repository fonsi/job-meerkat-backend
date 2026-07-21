import { randomBytes } from 'crypto';
import { magicLinkTtlMs } from 'magicLink/domain/constants';
import {
    MagicLinkPurpose,
    MagicLinkSubject,
    StoredMagicLink,
} from 'magicLink/domain/magicLink';
import { MagicLinkRepository } from 'magicLink/domain/magicLinkRepository';
import { buildSubjectPurposeKey } from './buildSubjectPurposeKey';
import { hashMagicLinkToken } from './hashToken';

export type IssueMagicLinkInput = {
    purpose: MagicLinkPurpose;
    subject: MagicLinkSubject;
    email: string;
    repository: MagicLinkRepository;
    /** When true (default), previous links for the same subject+purpose are removed. */
    replaceExisting?: boolean;
};

export type IssueMagicLinkResult = {
    token: string;
    expiresAt: number;
};

export const issueMagicLink = async ({
    purpose,
    subject,
    email,
    repository,
    replaceExisting = true,
}: IssueMagicLinkInput): Promise<IssueMagicLinkResult> => {
    const subjectPurposeKey = buildSubjectPurposeKey(purpose, subject);
    if (replaceExisting) {
        await repository.deleteBySubjectPurposeKey(subjectPurposeKey);
    }

    const token = randomBytes(32).toString('base64url');
    const tokenHash = hashMagicLinkToken(token);
    const issuedAt = Date.now();
    const expiresAt = issuedAt + magicLinkTtlMs(purpose);

    const row: StoredMagicLink = {
        tokenHash,
        subjectPurposeKey,
        purpose,
        subject,
        email,
        issuedAt,
        expiresAt,
    };

    await repository.put(row);

    return { token, expiresAt };
};
