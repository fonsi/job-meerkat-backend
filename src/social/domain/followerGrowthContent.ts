import { randomUUID, UUID } from 'crypto';

export const FOLLOWER_GROWTH_FAMILIES = [
    'salaryIntelligence',
    'marketSnapshot',
    'listingTeardown',
    'applicationGuidance',
    'remoteWorkReality',
    'decisionFramework',
    'communityPrompt',
] as const;

export type FollowerGrowthFamily = (typeof FOLLOWER_GROWTH_FAMILIES)[number];

export type FollowerGrowthContent = {
    id: UUID;
    generatedAt: number;
    family: FollowerGrowthFamily;
    topicKey: string;
    summary: string;
};

export const isFollowerGrowthFamily = (
    value: unknown,
): value is FollowerGrowthFamily =>
    typeof value === 'string' &&
    FOLLOWER_GROWTH_FAMILIES.includes(value as FollowerGrowthFamily);

export const normalizeFollowerGrowthFamily = (
    value: unknown,
): FollowerGrowthFamily | undefined => {
    if (typeof value !== 'string') return undefined;
    const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');

    return FOLLOWER_GROWTH_FAMILIES.find(
        (family) => family.toLowerCase() === normalized,
    );
};

export const createFollowerGrowthContent = (
    data: Omit<FollowerGrowthContent, 'id' | 'generatedAt'>,
): FollowerGrowthContent => ({
    id: randomUUID(),
    generatedAt: Date.now(),
    ...data,
});
