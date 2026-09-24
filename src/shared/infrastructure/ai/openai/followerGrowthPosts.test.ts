import { FollowerGrowthDataset } from 'social/application/followerGrowthDataResolver';
import { parseFollowerGrowthPosts } from './followerGrowthPosts';

const dataset: FollowerGrowthDataset = {
    generatedAt: '2026-09-22T12:00:00.000Z',
    scope: 'Current data',
    editorialThesis: 'Salary ceilings need context before guiding a decision',
    availability: [
        {
            requestIndex: 0,
            kind: 'salaryDistribution',
            status: 'available',
            message: 'Resolved salaryDistribution.',
        },
    ],
    evidence: [{ id: 'dataset', statement: 'There are 10 eligible listings.' }],
};

const response = {
    family: 'salaryIntelligence',
    topicKey: 'Salary Ceilings: Backend',
    summary: 'A current salary ceiling comparison.',
    evidenceIds: ['dataset'],
    posts: {
        bluesky: [
            'Bluesky post 1',
            'Bluesky post 2',
            'Bluesky post 3',
            'Bluesky post 4',
            'Bluesky post 5',
        ],
        threads: [
            'Threads post 1',
            'Threads post 2',
            'Threads post 3',
            'Threads post 4',
            'Threads post 5',
        ],
        x: ['X post 1', 'X post 2', 'X post 3', 'X post 4', 'X post 5'],
        linkedin: ['L'.repeat(1500)],
    },
};

describe('parseFollowerGrowthPosts', () => {
    it('parses and normalizes supported content', () => {
        expect(
            parseFollowerGrowthPosts(
                JSON.stringify(response),
                dataset,
                'salaryIntelligence',
            ),
        ).toEqual({
            family: 'salaryIntelligence',
            topicKey: 'salary-ceilings-backend',
            summary: response.summary,
            evidence: dataset.evidence,
            bluesky: response.posts.bluesky,
            threads: response.posts.threads,
            x: response.posts.x,
            linkedin: response.posts.linkedin,
        });
    });

    it('removes evidence ids from post text', () => {
        const parsed = parseFollowerGrowthPosts(
            JSON.stringify({
                ...response,
                posts: {
                    ...response.posts,
                    x: [
                        'Sales has the largest count of these four. [request-1]',
                        ...response.posts.x.slice(1),
                    ],
                },
            }),
            dataset,
            'salaryIntelligence',
        );

        expect(parsed.x[0]).toBe('Sales has the largest count of these four.');
    });

    it('rejects unsupported evidence', () => {
        expect(() =>
            parseFollowerGrowthPosts(
                JSON.stringify({
                    ...response,
                    evidenceIds: ['market-wide-trend'],
                }),
                dataset,
                'salaryIntelligence',
            ),
        ).toThrow('cited unsupported evidence');
    });

    it('accepts out-of-range drafts when limits are deferred', () => {
        const draft = {
            ...response,
            posts: {
                ...response.posts,
                x: ['x'.repeat(281)],
                linkedin: ['Too short'],
            },
        };

        expect(
            parseFollowerGrowthPosts(
                JSON.stringify(draft),
                dataset,
                'salaryIntelligence',
                { enforceLimits: false },
            ).linkedin,
        ).toEqual(['Too short']);
    });

    it('rejects threads outside 5-10 posts and short LinkedIn copy', () => {
        expect(() =>
            parseFollowerGrowthPosts(
                JSON.stringify({
                    ...response,
                    posts: {
                        ...response.posts,
                        x: response.posts.x.slice(0, 4),
                    },
                }),
                dataset,
                'salaryIntelligence',
            ),
        ).toThrow('X output must contain 5-10 posts');
        expect(() =>
            parseFollowerGrowthPosts(
                JSON.stringify({
                    ...response,
                    posts: {
                        ...response.posts,
                        linkedin: ['Too short'],
                    },
                }),
                dataset,
                'salaryIntelligence',
            ),
        ).toThrow('LinkedIn post must be at least 1500 characters');
    });

    it('rejects over-limit platform copy', () => {
        expect(() =>
            parseFollowerGrowthPosts(
                JSON.stringify({
                    ...response,
                    posts: {
                        ...response.posts,
                        x: ['x'.repeat(281), ...response.posts.x.slice(1)],
                    },
                }),
                dataset,
                'salaryIntelligence',
            ),
        ).toThrow('X post exceeds 280 characters');
    });

    it('rejects malformed and mismatched responses', () => {
        expect(() =>
            parseFollowerGrowthPosts(null, dataset, 'salaryIntelligence'),
        ).toThrow('response was empty');
        expect(() =>
            parseFollowerGrowthPosts(
                JSON.stringify({ ...response, family: 'marketSnapshot' }),
                dataset,
                'salaryIntelligence',
            ),
        ).toThrow('family must be salaryIntelligence');
    });
});
