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
    MIN_CATEGORY_SAMPLE,
    MIN_MONTHLY_SAMPLE,
} from 'blog/domain/blogSnapshot';
import { BlogPostType } from 'blog/domain/blogPost';
import {
    buildCategoryAnalysisSnapshot,
    buildMonthlyRecapSnapshot,
} from './buildBlogSnapshot';

const company = (id: string, name: string): Company => ({
    id: id as CompanyId,
    name,
    homePage: `https://${name.toLowerCase()}.com`,
    logo: { url: `https://assets.example.com/${id}.png` },
});

const job = ({
    id,
    companyId,
    category = Category.Frontend,
    max = 150000,
    createdAt = Date.UTC(2026, 8, 15),
}: {
    id: string;
    companyId: string;
    category?: Category;
    max?: number;
    createdAt?: number;
}): JobPost => ({
    id: id as JobPostId,
    originalId: id,
    companyId: companyId as CompanyId,
    slug: id,
    title: `Role ${id}`,
    url: 'https://example.com',
    category,
    type: JobType.FullTime,
    salaryRange: {
        min: max - 20000,
        max,
        currency: 'usd',
        period: Period.Year,
    },
    workplace: Workplace.Remote,
    location: 'worldwide',
    createdAt,
    closedAt: null,
});

const companies = [company('c1', 'Acme'), company('c2', 'Globex')];

describe('buildMonthlyRecapSnapshot', () => {
    it('returns null when the previous-month sample is too small', () => {
        expect(
            buildMonthlyRecapSnapshot({
                jobPosts: [job({ id: 'a', companyId: 'c1' })],
                companies,
                slug: 'remote-job-market-2026-09',
                now: Date.UTC(2026, 9, 7),
            }),
        ).toBeNull();
    });

    it('uses only jobs created in the previous calendar month', () => {
        const septemberJobs = Array.from(
            { length: MIN_MONTHLY_SAMPLE },
            (_, i) =>
                job({
                    id: `s${i}`,
                    companyId: i % 2 === 0 ? 'c1' : 'c2',
                    max: 120000 + i * 10000,
                    createdAt: Date.UTC(2026, 8, 10 + i),
                }),
        );
        const octoberNoise = job({
            id: 'oct',
            companyId: 'c1',
            createdAt: Date.UTC(2026, 9, 3),
            max: 400000,
        });
        const snapshot = buildMonthlyRecapSnapshot({
            jobPosts: [...septemberJobs, octoberNoise],
            companies,
            slug: 'remote-job-market-2026-09',
            now: Date.UTC(2026, 9, 7),
        });

        expect(snapshot?.kind).toBe(BlogPostType.MonthlyRecap);
        expect(snapshot?.periodLabel).toBe('September 2026');
        expect(snapshot?.periodStart).toBe('2026-09-01');
        expect(snapshot?.periodEnd).toBe('2026-09-30');
        expect(snapshot?.jobCount).toBe(MIN_MONTHLY_SAMPLE);
        expect(
            snapshot?.listings.some((item) => item.title === 'Role oct'),
        ).toBe(false);
        expect(snapshot?.listings[0].jobUrl).toContain('utm_source=blog');
        expect(snapshot?.listings[0].jobUrl).toContain(
            'utm_campaign=remote-job-market-2026-09',
        );
    });
});

describe('buildCategoryAnalysisSnapshot', () => {
    it('skips a category with too few listings in the previous week', () => {
        expect(
            buildCategoryAnalysisSnapshot({
                jobPosts: [
                    job({
                        id: 'a',
                        companyId: 'c1',
                        category: Category.Backend,
                        createdAt: Date.UTC(2026, 8, 30),
                    }),
                ],
                companies,
                slug: 'backend-jobs-2026-10-04',
                category: Category.Backend,
                now: Date.UTC(2026, 9, 7),
            }),
        ).toBeNull();
    });

    it('filters to the category and previous UTC week only', () => {
        // Previous week for Wed 7 Oct: Mon 28 Sep – Sun 4 Oct
        const inWeek = Array.from({ length: MIN_CATEGORY_SAMPLE }, (_, i) =>
            job({
                id: `b${i}`,
                companyId: 'c1',
                category: Category.Backend,
                createdAt: Date.UTC(2026, 8, 28 + i),
            }),
        );
        const outsideWeek = job({
            id: 'old',
            companyId: 'c1',
            category: Category.Backend,
            createdAt: Date.UTC(2026, 8, 20),
        });
        const otherCategory = job({
            id: 'f1',
            companyId: 'c2',
            category: Category.Frontend,
            createdAt: Date.UTC(2026, 8, 30),
        });
        const snapshot = buildCategoryAnalysisSnapshot({
            jobPosts: [...inWeek, outsideWeek, otherCategory],
            companies,
            slug: 'backend-jobs-2026-10-04',
            category: Category.Backend,
            now: Date.UTC(2026, 9, 7),
        });

        expect(snapshot?.jobCount).toBe(MIN_CATEGORY_SAMPLE);
        expect(snapshot?.periodLabel).toBe(
            'the week of 2026-09-28 to 2026-10-04',
        );
        expect(snapshot?.category?.slug).toBe('backend');
        expect(
            snapshot?.listings.every(
                (item) => item.category === Category.Backend,
            ),
        ).toBe(true);
        expect(
            snapshot?.listings.some((item) => item.title === 'Role old'),
        ).toBe(false);
    });
});
