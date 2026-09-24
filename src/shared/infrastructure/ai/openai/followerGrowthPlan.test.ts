import { parseFollowerGrowthPlan } from './followerGrowthPlan';

const concept = {
    family: 'applicationGuidance' as const,
    readerProblem:
        'A long requirement list makes qualified candidates unsure whether to apply',
    editorialThesis:
        'Requirement lists are better read as priorities than as perfect-match checklists',
    readerValue:
        'Readers can distinguish application-stopping gaps from gaps worth discussing',
    evidenceRole: 'support' as const,
};

describe('parseFollowerGrowthPlan', () => {
    it('parses bounded supported data requests', () => {
        expect(
            parseFollowerGrowthPlan(
                JSON.stringify({
                    supported: true,
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
                concept,
            ),
        ).toEqual({
            ...concept,
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

    it('returns null when the concept is unsupported', () => {
        expect(
            parseFollowerGrowthPlan(
                JSON.stringify({ supported: false }),
                concept,
            ),
        ).toBeNull();
    });

    it('rejects arbitrary query kinds and excessive samples', () => {
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    supported: true,
                    dataRequests: [{ kind: 'rawDynamoQuery', expression: '*' }],
                }),
                concept,
            ),
        ).toThrow('data request kind is invalid');
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    supported: true,
                    dataRequests: [
                        {
                            kind: 'listingDetails',
                            fields: ['requirements'],
                            sampleSize: 21,
                        },
                    ],
                }),
                concept,
            ),
        ).toThrow('sampleSize must be an integer from 1 to 20');
    });

    it('requires safe comparisons and an explicit support decision', () => {
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    supported: true,
                    dataRequests: [
                        {
                            kind: 'compareGroups',
                            dimension: 'category',
                            groups: ['Backend', 'Frontend'],
                            metric: 'salary',
                        },
                    ],
                }),
                concept,
            ),
        ).toThrow('salary comparisons require currency');
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    dataRequests: [{ kind: 'categoryDistribution' }],
                }),
                concept,
            ),
        ).toThrow('supported must be a boolean');
        expect(() =>
            parseFollowerGrowthPlan(
                JSON.stringify({
                    supported: true,
                    dataRequests: [{ kind: 'categoryDistribution' }],
                }),
                concept,
            ),
        ).toThrow('categoryDistribution cannot be the only request');
    });
});
