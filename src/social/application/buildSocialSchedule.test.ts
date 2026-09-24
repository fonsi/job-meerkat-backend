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
    COMPANY_THREADS_PER_DAY,
    companyThreadCountForPromos,
    MAX_PUBLICATIONS_PER_DAY,
    MIN_JOB_PROMOS_BEFORE_EXTRA_COMPANY_THREADS,
    NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS,
    SOCIAL_POST_SLOT_MS,
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

    it('schedules daily analysis, company thread, and job promos', () => {
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

        const analysis = scheduled.find(
            (post) => post.type === SocialPostType.DailyAnalysis,
        );
        expect(analysis?.date).toBe(Date.UTC(2026, 6, 21, 15));
        expect(analysis?.platforms).toEqual([
            SocialPlatform.Threads,
            SocialPlatform.Bluesky,
        ]);
        expect(scheduled[0].type).toBe(SocialPostType.JobPromo);

        const companyThreads = scheduled.filter(
            (post) => post.type === SocialPostType.CompanyThread,
        );
        expect(companyThreads).toHaveLength(2); // only c1 + c3 have descriptions
        expect(companyThreads.map((post) => post.companyId).sort()).toEqual([
            'c1',
            'c3',
        ]);

        const jobPromos = scheduled.filter(
            (post) => post.type === SocialPostType.JobPromo,
        );
        expect(jobPromos).toHaveLength(3);
        expect(scheduled.length).toBeLessThanOrEqual(MAX_PUBLICATIONS_PER_DAY);
        expect(scheduled[1].date - scheduled[0].date).toBe(SOCIAL_POST_SLOT_MS);
    });

    it('includes weekly top paid when requested', () => {
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
        expect(weekly?.date).toBe(Date.UTC(2026, 6, 21, 16));
        expect(weekly?.platforms).toEqual([
            SocialPlatform.Threads,
            SocialPlatform.Bluesky,
        ]);
    });

    it('caps total publications at MAX_PUBLICATIONS_PER_DAY', () => {
        const latestJobPosts = Array.from({ length: 60 }, (_, index) =>
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

        expect(scheduled.length).toBe(MAX_PUBLICATIONS_PER_DAY);
        expect(
            scheduled.every(
                (post) =>
                    post.platforms.includes(SocialPlatform.Threads) &&
                    post.platforms.includes(SocialPlatform.Bluesky),
            ),
        ).toBe(true);
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

    it('schedules up to three distinct company threads when there are at least 12 job promos', () => {
        const latestJobPosts = Array.from(
            { length: MIN_JOB_PROMOS_BEFORE_EXTRA_COMPANY_THREADS },
            (_, index) =>
                job({
                    id: `j${index}`,
                    companyId: `c${index}`,
                    max: 200000 - index * 1000,
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
            includeWeeklyTopPaid: false,
        });

        const companyThreads = scheduled.filter(
            (post) => post.type === SocialPostType.CompanyThread,
        );
        expect(companyThreads).toHaveLength(COMPANY_THREADS_PER_DAY);
        expect(new Set(companyThreads.map((post) => post.companyId)).size).toBe(
            COMPANY_THREADS_PER_DAY,
        );
    });

    it('interleaves company threads among job promos instead of grouping them', () => {
        const latestJobPosts = Array.from({ length: 20 }, (_, index) =>
            job({
                id: `j${index}`,
                companyId: `c${index}`,
                max: 200000 - index * 1000,
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
            includeWeeklyTopPaid: false,
        });

        const types = scheduled.map((post) => post.type);
        const threadIndices = types
            .map((type, i) => (type === SocialPostType.CompanyThread ? i : -1))
            .filter((i) => i >= 0);

        expect(threadIndices).toHaveLength(COMPANY_THREADS_PER_DAY);

        // Threads should not be consecutive
        for (let i = 1; i < threadIndices.length; i++) {
            expect(threadIndices[i] - threadIndices[i - 1]).toBeGreaterThan(1);
        }

        // Threads should have job promos both before and after them
        for (const idx of threadIndices) {
            const before = types.slice(0, idx);
            const after = types.slice(idx + 1);
            expect(before).toContain(SocialPostType.JobPromo);
            expect(after).toContain(SocialPostType.JobPromo);
        }
    });

    it('leaves capacity unused when there are not enough job promos', () => {
        const latestJobPosts = [
            job({ id: 'j1', companyId: 'c1', max: 200000 }),
        ];

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById,
            now,
            includeWeeklyTopPaid: false,
        });

        expect(scheduled.length).toBeLessThan(MAX_PUBLICATIONS_PER_DAY);
        expect(
            scheduled.filter((post) => post.type === SocialPostType.JobPromo),
        ).toHaveLength(1);
    });

    it('fills a day with no new jobs using company threads from open roles', () => {
        const openJobPosts = Array.from({ length: 12 }, (_, index) =>
            job({
                id: `open${index}`,
                companyId: `c${index}`,
                max: 200000 - index,
            }),
        );
        const openCompanies = openJobPosts.map((_, index) =>
            company(`c${index}`, `Co${index}`, 'A product company.'),
        );

        const scheduled = buildSocialSchedule({
            latestJobPosts: [],
            weekJobPosts: [],
            openJobPosts,
            companiesById: new Map(openCompanies.map((c) => [c.id, c])),
            now,
            includeWeeklyTopPaid: false,
        });

        const threads = scheduled.filter(
            (post) => post.type === SocialPostType.CompanyThread,
        );
        expect(threads).toHaveLength(companyThreadCountForPromos(0));
        expect(
            scheduled.every(
                (post) => post.type === SocialPostType.CompanyThread,
            ),
        ).toBe(true);
        expect(new Set(threads.map((post) => post.companyId)).size).toBe(12);
    });

    it('adds company threads when there are fewer than 12 job promos', () => {
        const latestJobPosts = Array.from({ length: 4 }, (_, index) =>
            job({
                id: `new${index}`,
                companyId: `new${index}`,
                max: 180000 - index,
            }),
        );
        const olderJobPosts = Array.from({ length: 10 }, (_, index) =>
            job({
                id: `old${index}`,
                companyId: `old${index}`,
                max: 120000 - index,
            }),
        );
        const companies = [...latestJobPosts, ...olderJobPosts].map((jobPost) =>
            company(jobPost.companyId, jobPost.companyId, 'A product company.'),
        );

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            openJobPosts: [...latestJobPosts, ...olderJobPosts],
            companiesById: new Map(companies.map((c) => [c.id, c])),
            now,
            includeWeeklyTopPaid: false,
        });

        const threads = scheduled.filter(
            (post) => post.type === SocialPostType.CompanyThread,
        );
        expect(threads).toHaveLength(companyThreadCountForPromos(4));
        expect(threads.map((post) => post.companyId)).toEqual(
            expect.arrayContaining(['new0', 'new1', 'new2', 'new3']),
        );
        expect(threads.some((post) => post.companyId.startsWith('old'))).toBe(
            true,
        );
    });

    it('adds one newsletter subscribe post when more than 50 new remote jobs have a public salary', () => {
        const latestJobPosts = Array.from(
            { length: NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS + 1 },
            (_, index) =>
                job({
                    id: `j${index}`,
                    companyId: `c${index}`,
                    max: 300000 - index,
                }),
        );
        const manyCompanies = latestJobPosts.map((_, index) =>
            company(`c${index}`, `Co${index}`, 'A product company.'),
        );

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById: new Map(manyCompanies.map((c) => [c.id, c])),
            now,
            includeWeeklyTopPaid: false,
        });

        const newsletter = scheduled.filter(
            (post) => post.type === SocialPostType.NewsletterSubscribe,
        );
        expect(newsletter).toHaveLength(1);
        expect(newsletter[0].id).toBe('newsletterSubscribe_2026-07-21');
        expect(newsletter[0].date).toBe(Date.UTC(2026, 6, 21, 17));
        expect(newsletter[0].platforms).toEqual([
            SocialPlatform.Threads,
            SocialPlatform.Bluesky,
        ]);

        const analysisIndex = scheduled.findIndex(
            (post) => post.type === SocialPostType.DailyAnalysis,
        );
        const newsletterIndex = scheduled.findIndex(
            (post) => post.type === SocialPostType.NewsletterSubscribe,
        );
        for (const index of [analysisIndex, newsletterIndex]) {
            expect(scheduled[index - 1].date).toBe(
                scheduled[index].date - SOCIAL_POST_SLOT_MS,
            );
            expect(scheduled[index + 1].date).toBe(
                scheduled[index].date + SOCIAL_POST_SLOT_MS,
            );
            expect([
                SocialPostType.JobPromo,
                SocialPostType.CompanyThread,
            ]).toContain(scheduled[index - 1].type);
            expect([
                SocialPostType.JobPromo,
                SocialPostType.CompanyThread,
            ]).toContain(scheduled[index + 1].type);
        }
        expect(scheduled.length).toBeLessThanOrEqual(MAX_PUBLICATIONS_PER_DAY);
    });

    it('keeps 17:00 and 19:00 Madrid after the clock change', () => {
        const winterNow = Date.UTC(2026, 0, 15, 2);
        const latestJobPosts = Array.from(
            { length: NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS + 1 },
            (_, index) =>
                job({
                    id: `j${index}`,
                    companyId: `c${index}`,
                    max: 300000 - index,
                }),
        );
        const manyCompanies = latestJobPosts.map((_, index) =>
            company(`c${index}`, `Co${index}`, 'A product company.'),
        );

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById: new Map(manyCompanies.map((c) => [c.id, c])),
            now: winterNow,
            includeWeeklyTopPaid: true,
        });

        expect(
            scheduled.find((post) => post.type === SocialPostType.DailyAnalysis)
                ?.date,
        ).toBe(Date.UTC(2026, 0, 15, 16));
        expect(
            scheduled.find((post) => post.type === SocialPostType.WeeklyTopPaid)
                ?.date,
        ).toBe(Date.UTC(2026, 0, 15, 17));
        expect(
            scheduled.find(
                (post) => post.type === SocialPostType.NewsletterSubscribe,
            )?.date,
        ).toBe(Date.UTC(2026, 0, 15, 18));
    });

    it('skips the newsletter post at 50 or fewer eligible jobs', () => {
        const latestJobPosts = Array.from(
            { length: NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS },
            (_, index) =>
                job({
                    id: `j${index}`,
                    companyId: `c${index}`,
                    max: 200000 - index,
                }),
        );
        const manyCompanies = latestJobPosts.map((_, index) =>
            company(`c${index}`, `Co${index}`, 'A product company.'),
        );

        const scheduled = buildSocialSchedule({
            latestJobPosts,
            weekJobPosts: latestJobPosts,
            companiesById: new Map(manyCompanies.map((c) => [c.id, c])),
            now,
            includeWeeklyTopPaid: false,
        });

        expect(
            scheduled.some(
                (post) => post.type === SocialPostType.NewsletterSubscribe,
            ),
        ).toBe(false);
    });

    it('ignores on-site and hidden-salary jobs when deciding the newsletter post', () => {
        const remote = Array.from({ length: 40 }, (_, index) =>
            job({
                id: `remote${index}`,
                companyId: `c${index}`,
                max: 200000 - index,
            }),
        );
        const onsite = Array.from({ length: 20 }, (_, index) =>
            job({
                id: `onsite${index}`,
                companyId: `o${index}`,
                max: 250000,
                workplace: Workplace.OnSite,
            }),
        );

        const scheduled = buildSocialSchedule({
            latestJobPosts: [...remote, ...onsite],
            weekJobPosts: remote,
            companiesById,
            now,
            includeWeeklyTopPaid: false,
        });

        expect(
            scheduled.some(
                (post) => post.type === SocialPostType.NewsletterSubscribe,
            ),
        ).toBe(false);
    });
});
