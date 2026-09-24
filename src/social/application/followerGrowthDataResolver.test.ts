import { Company, CompanyId } from 'company/domain/company';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { FollowerGrowthPlan } from 'social/domain/followerGrowthPlan';
import {
    buildFollowerGrowthInventory,
    followerGrowthDataIsComplete,
    resolveFollowerGrowthData,
    selectFollowerGrowthPlanDetailJobs,
} from './followerGrowthDataResolver';

const editorialScenario = {
    readerProblem:
        'A listing leaves the reader unsure whether the role merits an application',
    editorialThesis:
        'Responsibilities and constraints deserve more weight than labels',
    readerValue:
        'Readers can decide what to verify before investing in an application',
    evidenceRole: 'illustrate' as const,
};

const company = (id: string, status?: Company['status']): Company => ({
    id: id as CompanyId,
    name: `Company ${id}`,
    homePage: 'https://example.com',
    logo: { url: 'https://example.com/logo.png' },
    status,
});

const job = ({
    id,
    category,
    currency = 'USD',
    max,
    companyId = 'company-1',
}: {
    id: string;
    category: Category;
    currency?: string;
    max: number;
    companyId?: string;
}): JobPost =>
    ({
        id: id as JobPostId,
        originalId: id,
        companyId: companyId as CompanyId,
        type: JobType.FullTime,
        url: 'https://example.com/job',
        title: `${category} Engineer`,
        category,
        salaryRange: {
            min: max - 20000,
            max,
            currency,
            period: Period.Year,
        },
        workplace: Workplace.Remote,
        location: 'Worldwide',
        createdAt: max,
        closedAt: null,
        slug: id,
    }) as JobPost;

const companies = [
    company('company-1'),
    company('company-disabled', 'disabled'),
];
const jobs = [
    job({ id: 'backend-high', category: Category.Backend, max: 180000 }),
    job({ id: 'backend-low', category: Category.Backend, max: 120000 }),
    job({ id: 'frontend', category: Category.Frontend, max: 140000 }),
    job({
        id: 'disabled',
        category: Category.Backend,
        max: 300000,
        companyId: 'company-disabled',
    }),
];

describe('follower growth adaptive data resolution', () => {
    it('builds a safe inventory without exposing full listings', () => {
        expect(
            buildFollowerGrowthInventory({
                jobPosts: jobs,
                companies,
                now: Date.parse('2026-09-22T12:00:00.000Z'),
            }),
        ).toMatchObject({
            jobCount: 3,
            companyCount: 1,
            categories: [
                { value: 'Backend', count: 2 },
                { value: 'Frontend', count: 1 },
            ],
            currencies: [{ value: 'USD', count: 3 }],
        });
    });

    it('resolves only the evidence requested by the approved plan', () => {
        const plan: FollowerGrowthPlan = {
            family: 'applicationGuidance',
            ...editorialScenario,
            dataRequests: [
                {
                    kind: 'salaryDistribution',
                    category: Category.Backend,
                    currency: 'USD',
                },
                {
                    kind: 'detailPatterns',
                    category: Category.Backend,
                    fields: ['stack'],
                    sampleSize: 2,
                },
            ],
        };
        const details = new Map([
            [jobs[0].id, { stack: ['TypeScript', 'PostgreSQL'] }],
            [jobs[1].id, { stack: ['TypeScript', 'Node.js'] }],
        ]);
        const selected = selectFollowerGrowthPlanDetailJobs({
            plan,
            jobPosts: jobs,
            companies,
        });
        const dataset = resolveFollowerGrowthData({
            plan,
            jobPosts: jobs,
            companies,
            detailsByJobPostId: details,
        });

        expect(selected.map(({ id }) => id)).toEqual([jobs[0].id, jobs[1].id]);
        expect(followerGrowthDataIsComplete(dataset)).toBe(true);
        expect(dataset.evidence).toHaveLength(2);
        expect(dataset.evidence[0].statement).toContain('medianAnnualMaximum');
        expect(dataset.evidence[1].statement).toContain('TypeScript');
    });

    it('uses listing details beyond the highest-paid jobs', () => {
        const plan: FollowerGrowthPlan = {
            family: 'listingTeardown',
            ...editorialScenario,
            dataRequests: [
                {
                    kind: 'listingDetails',
                    category: Category.Backend,
                    fields: ['responsibilities'],
                    sampleSize: 1,
                },
            ],
        };
        const lowerPaid = job({
            id: 'backend-lower',
            category: Category.Backend,
            max: 90000,
        });
        const dataset = resolveFollowerGrowthData({
            plan,
            jobPosts: [...jobs, lowerPaid],
            companies,
            detailsByJobPostId: new Map([
                [lowerPaid.id, { responsibilities: ['Design APIs'] }],
            ]),
        });

        expect(followerGrowthDataIsComplete(dataset)).toBe(true);
        expect(dataset.evidence[0].statement).toContain('Design APIs');
    });

    it('reports unavailable data for one controlled re-planning attempt', () => {
        const plan: FollowerGrowthPlan = {
            family: 'listingTeardown',
            ...editorialScenario,
            dataRequests: [
                {
                    kind: 'listingDetails',
                    fields: ['hiringProcess'],
                    sampleSize: 3,
                },
            ],
        };
        const dataset = resolveFollowerGrowthData({
            plan,
            jobPosts: jobs,
            companies,
        });

        expect(followerGrowthDataIsComplete(dataset)).toBe(false);
        expect(dataset.availability).toEqual([
            expect.objectContaining({
                kind: 'listingDetails',
                status: 'unavailable',
            }),
        ]);
        expect(dataset.evidence).toEqual([]);
    });

    it('requires every comparison group to have data', () => {
        const plan: FollowerGrowthPlan = {
            family: 'salaryIntelligence',
            ...editorialScenario,
            dataRequests: [
                {
                    kind: 'compareGroups',
                    dimension: 'category',
                    groups: ['Backend', 'Legal'],
                    metric: 'salary',
                    currency: 'USD',
                },
            ],
        };
        const dataset = resolveFollowerGrowthData({
            plan,
            jobPosts: jobs,
            companies,
        });

        expect(followerGrowthDataIsComplete(dataset)).toBe(false);
    });

    it('rejects distributions without a meaningful alternative', () => {
        const plan: FollowerGrowthPlan = {
            family: 'decisionFramework',
            ...editorialScenario,
            dataRequests: [
                {
                    kind: 'jobTypeDistribution',
                    category: Category.Design,
                },
            ],
        };
        const designJobs = Array.from({ length: 10 }, (_, index) =>
            job({
                id: `design-${index}`,
                category: Category.Design,
                max: 100000 + index,
            }),
        );
        designJobs.push({
            ...job({
                id: 'design-contract',
                category: Category.Design,
                max: 90000,
            }),
            type: JobType.Contract,
        });
        const dataset = resolveFollowerGrowthData({
            plan,
            jobPosts: designJobs,
            companies,
        });

        expect(followerGrowthDataIsComplete(dataset)).toBe(false);
        expect(dataset.evidence).toEqual([]);
    });
});
