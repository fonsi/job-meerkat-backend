import {
    FollowerGrowthFamily,
    normalizeFollowerGrowthFamily,
} from 'social/domain/followerGrowthContent';
import {
    BLUESKY_MAX_GRAPHEMES,
    LINKEDIN_MAX_CHARACTERS,
    THREADS_MAX_CHARACTERS,
    X_MAX_CHARACTERS,
} from 'social/domain/socialPostLimits';
import { graphemeCount } from 'social/application/enforceSocialPostLimits';
import {
    FollowerGrowthEvidence,
    FollowerGrowthDataset,
} from 'social/application/followerGrowthDataResolver';

export type FollowerGrowthPosts = {
    family: FollowerGrowthFamily;
    topicKey: string;
    summary: string;
    evidence: FollowerGrowthEvidence[];
    bluesky: string[];
    threads: string[];
    x: string[];
    linkedin: string[];
};

const toStringList = (value: unknown, field: string): string[] => {
    if (!Array.isArray(value)) {
        throw new Error(`Follower growth posts ${field} must be an array`);
    }
    const posts = value.filter(
        (item): item is string =>
            typeof item === 'string' && item.trim().length > 0,
    );
    if (posts.length !== value.length || posts.length === 0) {
        throw new Error(
            `Follower growth posts ${field} must contain non-empty strings`,
        );
    }

    return posts;
};

const assertCodePointLimit = (
    platform: string,
    posts: string[],
    limit: number,
): void => {
    for (const post of posts) {
        if ([...post].length > limit) {
            throw new Error(
                `Follower growth ${platform} post exceeds ${limit} characters`,
            );
        }
    }
};

const assertThreadPostCount = (platform: string, posts: string[]): void => {
    if (posts.length < 2 || posts.length > 5) {
        throw new Error(
            `Follower growth ${platform} output must contain 2-5 posts`,
        );
    }
};

const normalizeTopicKey = (topicKey: string): string =>
    topicKey
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

export const parseFollowerGrowthPosts = (
    rawContent: string | null | undefined,
    dataset: FollowerGrowthDataset,
    expectedFamily: FollowerGrowthFamily,
): FollowerGrowthPosts => {
    if (!rawContent)
        throw new Error('Follower growth posts response was empty');

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawContent);
    } catch {
        throw new Error('Follower growth posts response was not JSON');
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Follower growth posts response was not an object');
    }

    const record = parsed as Record<string, unknown>;
    const family = normalizeFollowerGrowthFamily(record.family);
    if (!family) {
        throw new Error(
            `Follower growth posts family was invalid: ${JSON.stringify(record.family)}`,
        );
    }
    if (family !== expectedFamily) {
        throw new Error(
            `Follower growth posts family must be ${expectedFamily}`,
        );
    }
    if (typeof record.topicKey !== 'string') {
        throw new Error('Follower growth posts topicKey was missing');
    }
    const topicKey = normalizeTopicKey(record.topicKey);
    if (!topicKey) throw new Error('Follower growth posts topicKey was empty');
    if (
        typeof record.summary !== 'string' ||
        !record.summary.trim() ||
        record.summary.length > 280
    ) {
        throw new Error(
            'Follower growth posts summary must be 1-280 characters',
        );
    }

    const evidenceIds = toStringList(record.evidenceIds, 'evidenceIds');
    const evidenceById = new Map(
        dataset.evidence.map((evidence) => [evidence.id, evidence]),
    );
    const evidence = [...new Set(evidenceIds)].map((id) => {
        const item = evidenceById.get(id);
        if (!item) {
            throw new Error(
                `Follower growth posts cited unsupported evidence: ${id}`,
            );
        }

        return item;
    });
    const posts =
        record.posts && typeof record.posts === 'object'
            ? (record.posts as Record<string, unknown>)
            : {};
    const bluesky = toStringList(posts.bluesky, 'bluesky');
    const threads = toStringList(posts.threads, 'threads');
    const x = toStringList(posts.x, 'x');
    const linkedin = toStringList(posts.linkedin, 'linkedin');

    assertThreadPostCount('Bluesky', bluesky);
    assertThreadPostCount('Threads', threads);
    assertThreadPostCount('X', x);
    if (linkedin.length !== 1) {
        throw new Error(
            'Follower growth LinkedIn output must contain exactly one post',
        );
    }
    for (const post of bluesky) {
        if (graphemeCount(post) > BLUESKY_MAX_GRAPHEMES) {
            throw new Error(
                `Follower growth Bluesky post exceeds ${BLUESKY_MAX_GRAPHEMES} graphemes`,
            );
        }
    }
    assertCodePointLimit('Threads', threads, THREADS_MAX_CHARACTERS);
    assertCodePointLimit('X', x, X_MAX_CHARACTERS);
    assertCodePointLimit('LinkedIn', linkedin, LINKEDIN_MAX_CHARACTERS);

    return {
        family,
        topicKey,
        summary: record.summary.trim(),
        evidence,
        bluesky,
        threads,
        x,
        linkedin,
    };
};
