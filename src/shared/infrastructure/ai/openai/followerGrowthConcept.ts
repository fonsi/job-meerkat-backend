import {
    FollowerGrowthFamily,
    normalizeFollowerGrowthFamily,
} from 'social/domain/followerGrowthContent';
import {
    FOLLOWER_GROWTH_EVIDENCE_ROLES,
    FollowerGrowthConcept,
    FollowerGrowthEvidenceRole,
} from 'social/domain/followerGrowthPlan';

const MAX_FIELD_LENGTH = 280;

const asRecord = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('Follower growth concept response must be an object');
    }

    return value as Record<string, unknown>;
};

const parseField = (
    value: unknown,
    field: 'readerProblem' | 'editorialThesis' | 'readerValue',
): string => {
    if (
        typeof value !== 'string' ||
        !value.trim() ||
        value.length > MAX_FIELD_LENGTH
    ) {
        throw new Error(
            `Follower growth concept ${field} must be 1-${MAX_FIELD_LENGTH} characters`,
        );
    }

    return value.trim();
};

const parseEvidenceRole = (value: unknown): FollowerGrowthEvidenceRole => {
    if (
        typeof value !== 'string' ||
        !FOLLOWER_GROWTH_EVIDENCE_ROLES.includes(
            value as FollowerGrowthEvidenceRole,
        )
    ) {
        throw new Error('Follower growth concept evidenceRole was invalid');
    }

    return value as FollowerGrowthEvidenceRole;
};

export const parseFollowerGrowthConcept = (
    rawContent: string | null | undefined,
    requestedFamily?: FollowerGrowthFamily,
): FollowerGrowthConcept => {
    if (!rawContent)
        throw new Error('Follower growth concept response was empty');

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawContent);
    } catch {
        throw new Error('Follower growth concept response was not JSON');
    }
    const record = asRecord(parsed);
    const family = normalizeFollowerGrowthFamily(record.family);
    if (!family) {
        throw new Error(
            `Follower growth concept family was invalid: ${JSON.stringify(record.family)}`,
        );
    }
    if (requestedFamily && family !== requestedFamily) {
        throw new Error(
            `Follower growth concept family must be ${requestedFamily}`,
        );
    }

    return {
        family,
        readerProblem: parseField(record.readerProblem, 'readerProblem'),
        editorialThesis: parseField(record.editorialThesis, 'editorialThesis'),
        readerValue: parseField(record.readerValue, 'readerValue'),
        evidenceRole: parseEvidenceRole(record.evidenceRole),
    };
};
