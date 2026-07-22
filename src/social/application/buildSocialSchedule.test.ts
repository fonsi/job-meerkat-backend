import { Company, CompanyId } from 'company/domain/company';
import {
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
    Category,
} from 'jobPost/domain/jobPost';
import { buildSocialSchedule } from './buildSocialSchedule';
import { SocialPostType } from 'social/domain/socialPostType';
import { SocialPlatform } from 'social/domain/socialPlatform';
import {
    MAX_PUBLICATIONS_PER_DAY,
    X_DAILY_PUBLICATION_BUDGET,
} from 'social/domain/socialScheduleConfig';

const company = (id: string, name: string, description?: string): Company => ({
    id: id as CompanyId,
    name,
    homePage: `https://${name.toLowerCase()}.com`,
    logo: { url: `https://assets.example.com/${id}.png` },
    ...(description ? { description } : {}),
});

const job = ({
    id,
    companyId,
    max,
    createdAt = Date.UTC(2026, 6, 21, 12),
    workplace = Workplace.Remote,
    currency = 'usd',
    salaryRange,
}: {
    id: string;
    companyId: string;
    max?: number;
    createdAt?: number;
    workplace?: Workplace;
    currency?: string;
    salaryRange?: JobPost['salaryRange'];
}): JobPost => ({
    id: id as JobPostId,
    originalId: id,
    companyId: companyId as CompanyId,
    slug: id,
    title: `Role ${id}`,
    url: 'https://example.com',
    category: Category.Frontend,
    type: JobType.FullTime,
    salaryRange:
        salaryRange !== undefined
            ? salaryRange
            : {
                  min: (max ?? 0) - 10000,
                  max: max ?? 0,
                  currency,
                  period: Period.Year,
              },
    workplace,
    location: 'worldwide',
    createdAt,
    closedAt: null,
});

describe('buildSocialSchedule', () => {
    const now = Date.UTC(2026, 6, 21, 2); // Tuesday
    const companies = [
        company('c1', 'Acme', 'Acme builds tools.'),
        company('c2', 'Beta'),
        company('c3', 'Gamma', 'Gamma does AI.'),
    ];
    const companiesById = new Map(companies.map((c) => [c.id, c]));

    it('schedules daily analysis, company thread, and job promos with X quota', () => {
        const latestJobPosts = [
            job({ id: 'j1', companyId: 'c1', max: 200000 }),
            job({ id: 'j2', companyId: 'c2', max: 180000 }),
            job({ id: 'j3', companyId: 'c3', max: 160000 }),
            job({ id: 'j4', companyId: 'c1', max: 150000 }),
        ];

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById,
            now,
            includeWeeklyTopPaid: false,
        });

        expect(scheduled[0].type).toBe(SocialPostType.DailyAnalysis);
        expect(scheduled[0].platforms).toContain(SocialPlatform.X);

        expect(
            scheduled.some(
                (post) => post.type === SocialPostType.CompanyThread,
            ),
        ).toBe(true);

        const jobPromos = scheduled.filter(
            (post) => post.type === SocialPostType.JobPromo,
        );
        expect(jobPromos).toHaveLength(3);

        const xPublications = scheduled.filter((post) =>
            post.platforms.includes(SocialPlatform.X),
        );
        expect(xPublications.length).toBeLessThanOrEqual(
            X_DAILY_PUBLICATION_BUDGET,
        );
        expect(scheduled.length).toBeLessThanOrEqual(MAX_PUBLICATIONS_PER_DAY);
    });

    it('includes weekly top paid when requested and reserves X', () => {
        const latestJobPosts = [
            job({ id: 'j1', companyId: 'c1', max: 200000 }),
        ];

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById,
            now,
            includeWeeklyTopPaid: true,
        });

        expect(scheduled.map((post) => post.type)).toEqual(
            expect.arrayContaining([
                SocialPostType.DailyAnalysis,
                SocialPostType.WeeklyTopPaid,
                SocialPostType.JobPromo,
            ]),
        );

        const weekly = scheduled.find(
            (post) => post.type === SocialPostType.WeeklyTopPaid,
        );
        expect(weekly?.platforms).toContain(SocialPlatform.X);
    });

    it('puts surplus job promos on Threads/Bluesky only once X budget is used', () => {
        const latestJobPosts = Array.from({ length: 20 }, (_, index) =>
            job({
                id: `j${index}`,
                companyId: `c${index}`,
                max: 300000 - index * 1000,
            }),
        );
        const manyCompanies = latestJobPosts.map((_, index) =>
            company(`c${index}`, `Co${index}`, 'A product company.'),
        );
        const manyById = new Map(manyCompanies.map((c) => [c.id, c]));

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById: manyById,
            now,
            includeWeeklyTopPaid: true,
        });

        const xCount = scheduled.filter((post) =>
            post.platforms.includes(SocialPlatform.X),
        ).length;
        expect(xCount).toBe(X_DAILY_PUBLICATION_BUDGET);

        const jobPromosWithoutX = scheduled.filter(
            (post) =>
                post.type === SocialPostType.JobPromo &&
                !post.platforms.includes(SocialPlatform.X),
        );
        expect(jobPromosWithoutX.length).toBeGreaterThan(0);
    });

    it('only includes remote jobs with public salary for promos', () => {
        const latestJobPosts = [
            job({ id: 'remote', companyId: 'c1', max: 200000 }),
            job({
                id: 'onsite',
                companyId: 'c2',
                max: 250000,
                workplace: Workplace.OnSite,
            }),
            job({
                id: 'nosalary',
                companyId: 'c3',
                salaryRange: null,
            }),
        ];

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById,
            now,
            includeWeeklyTopPaid: false,
        });

        const jobPromos = scheduled.filter(
            (post) => post.type === SocialPostType.JobPromo,
        );
        expect(jobPromos).toHaveLength(1);
        expect(jobPromos[0].jobPostId).toBe('remote');
    });

    it('skips analysis posts when only non-USD/EUR salaries exist', () => {
        const latestJobPosts = [
            job({
                id: 'gbp',
                companyId: 'c1',
                max: 200000,
                currency: 'gbp',
            }),
        ];

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById,
            now,
            includeWeeklyTopPaid: true,
        });

        expect(
            scheduled.some(
                (post) =>
                    post.type === SocialPostType.DailyAnalysis ||
                    post.type === SocialPostType.WeeklyTopPaid ||
                    post.type === SocialPostType.CompanyThread,
            ),
        ).toBe(false);
        expect(
            scheduled.some((post) => post.type === SocialPostType.JobPromo),
        ).toBe(true);
    });
});
