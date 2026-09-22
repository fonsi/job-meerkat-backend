import { parseFollowerGrowthPlan } from './followerGrowthPlan';

describe('parseFollowerGrowthPlan', () => {
    it('parses bounded supported data requests', () => {
        expect(
            parseFollowerGrowthPlan(
                JSON.stringify({
                    family: 'applicationGuidance',
                    angle: 'Recurring backend requirements',
                    dataRequests: [
                        {
                            kind: 'detailPatterns',
                            category: 'Backend',
                            fields: ['requirements', 'stack'],
                            sampleSize: 20,
                        },
                        {
                            kind: 'compareGroups',
                            dimension: 'category',
                            groups: ['Backend', 'Frontend'],
                            metric: 'salary',
                            currency: 'USD',
                        },
                    ],
                }),
                'applicationGuidance',
            ),
        ).toEqual({
            family: 'applicationGuidance',
            angle: 'Recurring backend requirements',
            dataRequests: [
                {
                    kind: 'detailPatterns',
                    category: 'Backend',
                    fields: ['requirements', 'stack'],
                    sampleSize: 20,
                },
                {
                    kind: 'compareGroups',
                    dimension: 'category',
                    groups: ['Backend', 'Frontend'],
                    metric: 'salary',
                    currency: 'USD',
                },
            ],
        });
    });

    it('normalizes equivalent family labels', () => {
        expect(
            parseFollowerGrowthPlan(
                JSON.stringify({
                    plan: {
                        family: 'salary_intelligence',
                        angle: 'Current salary ceilings',
                        dataRequests: [{ kind: 'categoryDistribution' }],
                    },
                }),
            ).family,
        ).toBe('salaryIntelligence');
    });

    it('rejects arbitrary query kinds and excessive samples', () => {
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    family: 'marketSnapshot',
                    angle: 'Run a custom query',
                    dataRequests: [{ kind: 'rawDynamoQuery', expression: '*' }],
                }),
            ),
        ).toThrow('data request kind is invalid');
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    family: 'listingTeardown',
                    angle: 'Review requirements',
                    dataRequests: [
                        {
                            kind: 'listingDetails',
                            fields: ['requirements'],
                            sampleSize: 21,
                        },
                    ],
                }),
            ),
        ).toThrow('sampleSize must be an integer from 1 to 20');
    });

    it('requires the requested family and safe salary comparisons', () => {
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    family: 'marketSnapshot',
                    angle: 'Salary comparison',
                    dataRequests: [{ kind: 'salaryDistribution' }],
                }),
                'salaryIntelligence',
            ),
        ).toThrow('family must be salaryIntelligence');
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    family: 'salaryIntelligence',
                    angle: 'Salary comparison',
                    dataRequests: [
                        {
                            kind: 'compareGroups',
                            dimension: 'category',
                            groups: ['Backend', 'Frontend'],
                            metric: 'salary',
                        },
                    ],
                }),
            ),
        ).toThrow('salary comparisons require currency');
    });
});
