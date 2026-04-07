import {
    Category,
    JobPost,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { NewsletterPreferences } from 'report/domain/newsletterPreferences';
import { filterJobPostsForNewsletter } from './filterJobPostsForNewsletter';

const basePost = (overrides: Partial<JobPost>): JobPost => ({
    id: '00000000-0000-4000-8000-000000000001',
    originalId: 'x',
    companyId: '00000000-0000-4000-8000-0000000000aa',
    type: JobType.FullTime,
    url: 'https://example.com',
    title: 'Engineer',
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
    slug: 'engineer-at-co-abc',
    ...overrides,
});

const allOpenPrefs = (): NewsletterPreferences => ({
    allowedCategorySlugs: null,
    allowedCompanyIds: null,
    allowedWorkplaces: null,
    publicSalaryOnly: false,
    updatedAt: 1,
});

describe('filterJobPostsForNewsletter', () => {
    it('returns all posts when preferences undefined', () => {
        const posts = [basePost({})];
        expect(filterJobPostsForNewsletter(posts, undefined)).toEqual(posts);
    });

    it('returns all posts when all dimensions are null (allow all)', () => {
        const posts = [
            basePost({}),
            basePost({
                companyId: '00000000-0000-4000-8000-0000000000bb',
                id: '00000000-0000-4000-8000-000000000002',
            }),
        ];
        expect(filterJobPostsForNewsletter(posts, allOpenPrefs())).toEqual(
            posts,
        );
    });

    it('filters by company id', () => {
        const a = '00000000-0000-4000-8000-0000000000aa';
        const b = '00000000-0000-4000-8000-0000000000bb';
        const posts = [
            basePost({ companyId: a }),
            basePost({
                companyId: b,
                id: '00000000-0000-4000-8000-000000000002',
            }),
        ];
        const prefs: NewsletterPreferences = {
            allowedCategorySlugs: null,
            allowedCompanyIds: [a],
            allowedWorkplaces: null,
            publicSalaryOnly: false,
            updatedAt: 1,
        };
        const out = filterJobPostsForNewsletter(posts, prefs);
        expect(out).toHaveLength(1);
        expect(out[0].companyId).toBe(a);
    });

    it('filters by category slug', () => {
        const posts = [
            basePost({ category: Category.Backend }),
            basePost({
                category: Category.Frontend,
                id: '00000000-0000-4000-8000-000000000003',
            }),
        ];
        const prefs: NewsletterPreferences = {
            allowedCategorySlugs: ['frontend'],
            allowedCompanyIds: null,
            allowedWorkplaces: null,
            publicSalaryOnly: false,
            updatedAt: 1,
        };
        const out = filterJobPostsForNewsletter(posts, prefs);
        expect(out).toHaveLength(1);
        expect(out[0].category).toBe(Category.Frontend);
    });

    it('filters public salary only', () => {
        const posts = [
            basePost({ salaryRange: null }),
            basePost({
                salaryRange: {
                    max: 1,
                    currency: 'USD',
                    period: Period.Year,
                },
                id: '00000000-0000-4000-8000-000000000004',
            }),
        ];
        const prefs: NewsletterPreferences = {
            allowedCategorySlugs: null,
            allowedCompanyIds: null,
            allowedWorkplaces: null,
            publicSalaryOnly: true,
            updatedAt: 1,
        };
        const out = filterJobPostsForNewsletter(posts, prefs);
        expect(out).toHaveLength(1);
        expect(out[0].salaryRange).not.toBeNull();
    });
});
