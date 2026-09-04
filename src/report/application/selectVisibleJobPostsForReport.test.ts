import { Company, CompanyId } from 'company/domain/company';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import {
    COMPACT_MAX_JOB_POSTS_PER_COMPANY,
    COMPACT_TOTAL_JOB_POSTS_THRESHOLD,
    DEFAULT_MAX_JOB_POSTS_PER_COMPANY,
    SINGLE_COMPANY_COUNT_THRESHOLD,
    SINGLE_MAX_JOB_POSTS_PER_COMPANY,
    maxJobPostsPerCompany,
    selectVisibleJobPostsForReport,
} from './selectVisibleJobPostsForReport';

const company = (idSuffix: string, name: string): Company => ({
    id: `00000000-0000-4000-8000-0000000000${idSuffix}` as CompanyId,
    name,
    homePage: 'https://example.com',
    logo: { url: 'https://example.com/logo.png' },
});

const jobPost = (companyId: CompanyId, idSuffix: string): JobPost => ({
    id: `00000000-0000-4000-8000-0000000001${idSuffix}` as JobPostId,
    originalId: idSuffix,
    companyId,
    type: JobType.FullTime,
    url: 'https://example.com',
    title: `Job ${idSuffix}`,
    category: Category.Backend,
    salaryRange: {
        min: 100,
        max: 200,
        currency: 'USD',
        period: Period.Year,
    },
    workplace: Workplace.Remote,
    location: 'Earth',
    createdAt: 1,
    closedAt: null,
    slug: `job-${idSuffix}`,
});

const jobsFor = (co: Company, count: number): JobPost[] =>
    Array.from({ length: count }, (_, i) =>
        jobPost(co.id, `${co.id.slice(-2)}${String(i).padStart(2, '0')}`),
    );

describe('maxJobPostsPerCompany', () => {
    it('keeps 4 per company at or below the compact threshold', () => {
        expect(
            maxJobPostsPerCompany(
                COMPACT_TOTAL_JOB_POSTS_THRESHOLD,
                SINGLE_COMPANY_COUNT_THRESHOLD + 1,
            ),
        ).toBe(DEFAULT_MAX_JOB_POSTS_PER_COMPANY);
    });

    it('drops to 2 per company when there are more than 60 jobs and 25 or fewer companies', () => {
        expect(
            maxJobPostsPerCompany(
                COMPACT_TOTAL_JOB_POSTS_THRESHOLD + 1,
                SINGLE_COMPANY_COUNT_THRESHOLD,
            ),
        ).toBe(COMPACT_MAX_JOB_POSTS_PER_COMPANY);
    });

    it('drops to 1 per company when there are more than 60 jobs and more than 25 companies', () => {
        expect(
            maxJobPostsPerCompany(
                COMPACT_TOTAL_JOB_POSTS_THRESHOLD + 1,
                SINGLE_COMPANY_COUNT_THRESHOLD + 1,
            ),
        ).toBe(SINGLE_MAX_JOB_POSTS_PER_COMPANY);
    });
});

describe('selectVisibleJobPostsForReport', () => {
    it('shows up to 4 jobs per company when the report is small', () => {
        const acme = company('aa', 'Acme');
        const beta = company('bb', 'Beta');
        const { companies } = selectVisibleJobPostsForReport(
            [
                { company: acme, jobPosts: jobsFor(acme, 6) },
                { company: beta, jobPosts: jobsFor(beta, 2) },
            ],
            8,
        );

        expect(companies[0].visibleJobPosts).toHaveLength(4);
        expect(companies[1].visibleJobPosts).toHaveLength(2);
    });

    it('shows up to 2 jobs per company when there are more than 60 jobs', () => {
        const acme = company('aa', 'Acme');
        const beta = company('bb', 'Beta');
        const { companies } = selectVisibleJobPostsForReport(
            [
                { company: acme, jobPosts: jobsFor(acme, 8) },
                { company: beta, jobPosts: jobsFor(beta, 8) },
            ],
            COMPACT_TOTAL_JOB_POSTS_THRESHOLD + 1,
        );

        expect(companies[0].visibleJobPosts).toHaveLength(2);
        expect(companies[1].visibleJobPosts).toHaveLength(2);
    });

    it('shows up to 2 jobs per company when there are more than 60 jobs and 25 or fewer companies', () => {
        const list = Array.from(
            { length: SINGLE_COMPANY_COUNT_THRESHOLD },
            (_, i) => {
                const suffix = String(i).padStart(2, '0');
                const co = company(suffix, `Co ${i}`);
                return { company: co, jobPosts: jobsFor(co, 4) };
            },
        );
        const { companies } = selectVisibleJobPostsForReport(
            list,
            COMPACT_TOTAL_JOB_POSTS_THRESHOLD + 1,
        );

        expect(companies).toHaveLength(SINGLE_COMPANY_COUNT_THRESHOLD);
        expect(companies.every((c) => c.visibleJobPosts.length === 2)).toBe(
            true,
        );
    });

    it('shows 1 job per company when there are more than 60 jobs and more than 25 companies', () => {
        const list = Array.from(
            { length: SINGLE_COMPANY_COUNT_THRESHOLD + 1 },
            (_, i) => {
                const suffix = String(i).padStart(2, '0');
                const co = company(suffix, `Co ${i}`);
                return { company: co, jobPosts: jobsFor(co, 4) };
            },
        );
        const { companies } = selectVisibleJobPostsForReport(
            list,
            COMPACT_TOTAL_JOB_POSTS_THRESHOLD + 1,
        );

        expect(companies).toHaveLength(SINGLE_COMPANY_COUNT_THRESHOLD + 1);
        expect(companies.every((c) => c.visibleJobPosts.length === 1)).toBe(
            true,
        );
    });
});
