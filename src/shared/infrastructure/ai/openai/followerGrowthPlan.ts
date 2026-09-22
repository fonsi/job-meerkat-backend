import { Category } from 'jobPost/domain/jobPost';
import {
    FollowerGrowthFamily,
    normalizeFollowerGrowthFamily,
} from 'social/domain/followerGrowthContent';
import {
    FOLLOWER_GROWTH_DETAIL_FIELDS,
    FollowerGrowthCurrency,
    FollowerGrowthDataRequest,
    FollowerGrowthDetailField,
    FollowerGrowthPlan,
} from 'social/domain/followerGrowthPlan';

const MAX_DATA_REQUESTS = 4;
const MAX_DETAIL_FIELDS = 4;
const MAX_DETAIL_SAMPLE = 20;
const MAX_LISTINGS = 8;
const MAX_COMPARE_GROUPS = 4;

const asRecord = (value: unknown, field: string): Record<string, unknown> => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`Follower growth plan ${field} must be an object`);
    }

    return value as Record<string, unknown>;
};

const parseCategory = (value: unknown): Category | undefined => {
    if (value == null) return undefined;
    if (
        typeof value !== 'string' ||
        !Object.values(Category).includes(value as Category)
    ) {
        throw new Error(`Follower growth plan category is invalid: ${value}`);
    }

    return value as Category;
};

const parseCurrency = (value: unknown): FollowerGrowthCurrency | undefined => {
    if (value == null) return undefined;
    if (value !== 'USD' && value !== 'EUR') {
        throw new Error(`Follower growth plan currency is invalid: ${value}`);
    }

    return value;
};

const parseBoundedInteger = (
    value: unknown,
    field: string,
    max: number,
): number => {
    if (
        typeof value !== 'number' ||
        !Number.isInteger(value) ||
        value < 1 ||
        value > max
    ) {
        throw new Error(
            `Follower growth plan ${field} must be an integer from 1 to ${max}`,
        );
    }

    return value;
};

const parseDetailFields = (value: unknown): FollowerGrowthDetailField[] => {
    if (
        !Array.isArray(value) ||
        value.length === 0 ||
        value.length > MAX_DETAIL_FIELDS
    ) {
        throw new Error(
            `Follower growth plan fields must contain 1-${MAX_DETAIL_FIELDS} items`,
        );
    }
    const fields = [...new Set(value)];
    if (
        fields.length !== value.length ||
        fields.some(
            (field) =>
                typeof field !== 'string' ||
                !FOLLOWER_GROWTH_DETAIL_FIELDS.includes(
                    field as FollowerGrowthDetailField,
                ),
        )
    ) {
        throw new Error('Follower growth plan fields are invalid');
    }

    return fields as FollowerGrowthDetailField[];
};

const parseDataRequest = (value: unknown): FollowerGrowthDataRequest => {
    const record = asRecord(value, 'data request');
    const category = parseCategory(record.category);
    const currency = parseCurrency(record.currency);

    switch (record.kind) {
        case 'salaryDistribution':
            return {
                kind: record.kind,
                ...(category ? { category } : {}),
                ...(currency ? { currency } : {}),
            };
        case 'categoryDistribution':
            return { kind: record.kind };
        case 'locationDistribution':
        case 'jobTypeDistribution':
            return {
                kind: record.kind,
                ...(category ? { category } : {}),
            };
        case 'topListings':
            return {
                kind: record.kind,
                limit: parseBoundedInteger(record.limit, 'limit', MAX_LISTINGS),
                ...(category ? { category } : {}),
                ...(currency ? { currency } : {}),
            };
        case 'listingDetails':
        case 'detailPatterns':
            return {
                kind: record.kind,
                fields: parseDetailFields(record.fields),
                sampleSize: parseBoundedInteger(
                    record.sampleSize,
                    'sampleSize',
                    MAX_DETAIL_SAMPLE,
                ),
                ...(category ? { category } : {}),
                ...(currency ? { currency } : {}),
            };
        case 'compareGroups': {
            if (
                record.dimension !== 'category' &&
                record.dimension !== 'jobType' &&
                record.dimension !== 'location'
            ) {
                throw new Error(
                    'Follower growth plan compareGroups dimension is invalid',
                );
            }
            if (record.metric !== 'count' && record.metric !== 'salary') {
                throw new Error(
                    'Follower growth plan compareGroups metric is invalid',
                );
            }
            if (
                !Array.isArray(record.groups) ||
                record.groups.length < 2 ||
                record.groups.length > MAX_COMPARE_GROUPS ||
                record.groups.some(
                    (group) =>
                        typeof group !== 'string' ||
                        !group.trim() ||
                        group.length > 100,
                )
            ) {
                throw new Error(
                    `Follower growth plan compareGroups groups must contain 2-${MAX_COMPARE_GROUPS} strings`,
                );
            }
            const groups = [
                ...new Set(record.groups.map((group) => group.trim())),
            ];
            if (groups.length !== record.groups.length) {
                throw new Error(
                    'Follower growth plan compareGroups groups must be unique',
                );
            }
            if (record.metric === 'salary' && !currency) {
                throw new Error(
                    'Follower growth plan salary comparisons require currency',
                );
            }

            return {
                kind: record.kind,
                dimension: record.dimension,
                groups,
                metric: record.metric,
                ...(currency ? { currency } : {}),
            };
        }
        default:
            throw new Error(
                `Follower growth plan data request kind is invalid: ${record.kind}`,
            );
    }
};

export const parseFollowerGrowthPlan = (
    rawContent: string | null | undefined,
    requestedFamily?: FollowerGrowthFamily,
): FollowerGrowthPlan => {
    if (!rawContent) throw new Error('Follower growth plan response was empty');

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawContent);
    } catch {
        throw new Error('Follower growth plan response was not JSON');
    }
    const record = asRecord(parsed, 'response');
    const planRecord =
        record.family == null && record.plan != null
            ? asRecord(record.plan, 'plan')
            : record;
    const family = normalizeFollowerGrowthFamily(planRecord.family);
    if (!family) {
        throw new Error(
            `Follower growth plan family was invalid: ${JSON.stringify(planRecord.family)}`,
        );
    }
    if (requestedFamily && family !== requestedFamily) {
        throw new Error(
            `Follower growth plan family must be ${requestedFamily}`,
        );
    }
    if (
        typeof planRecord.angle !== 'string' ||
        !planRecord.angle.trim() ||
        planRecord.angle.length > 280
    ) {
        throw new Error('Follower growth plan angle must be 1-280 characters');
    }
    if (
        !Array.isArray(planRecord.dataRequests) ||
        planRecord.dataRequests.length === 0 ||
        planRecord.dataRequests.length > MAX_DATA_REQUESTS
    ) {
        throw new Error(
            `Follower growth plan dataRequests must contain 1-${MAX_DATA_REQUESTS} items`,
        );
    }

    return {
        family,
        angle: planRecord.angle.trim(),
        dataRequests: planRecord.dataRequests.map(parseDataRequest),
    };
};
