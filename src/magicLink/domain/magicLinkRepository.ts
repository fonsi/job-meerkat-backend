import { StoredMagicLink } from './magicLink';

export type PutMagicLink = (link: StoredMagicLink) => Promise<void>;

export type DeleteBySubjectPurposeKey = (
    subjectPurposeKey: string,
) => Promise<void>;

export type GetByTokenHash = (
    tokenHash: string,
) => Promise<StoredMagicLink | null>;

export interface MagicLinkRepository {
    put: PutMagicLink;
    deleteBySubjectPurposeKey: DeleteBySubjectPurposeKey;
    getByTokenHash: GetByTokenHash;
}
