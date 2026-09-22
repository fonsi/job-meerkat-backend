import { FollowerGrowthDataset } from 'social/application/followerGrowthDataResolver';
import { parseFollowerGrowthPosts } from './followerGrowthPosts';

const dataset: FollowerGrowthDataset = {
    generatedAt: '2026-09-22T12:00:00.000Z',
    scope: 'Current data',
    angle: 'Current salary comparison',
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
        bluesky: ['Bluesky post 1', 'Bluesky post 2'],
        threads: ['Threads post 1', 'Threads post 2'],
        x: ['X post 1', 'X post 2'],
        linkedin: ['LinkedIn post'],
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
            bluesky: ['Bluesky post 1', 'Bluesky post 2'],
            threads: ['Threads post 1', 'Threads post 2'],
            x: ['X post 1', 'X post 2'],
            linkedin: ['LinkedIn post'],
        });
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

    it('rejects over-limit platform copy', () => {
        expect(() =>
            parseFollowerGrowthPosts(
                JSON.stringify({
                    ...response,
                    posts: {
                        ...response.posts,
                        x: ['x'.repeat(281), 'Second X post'],
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
