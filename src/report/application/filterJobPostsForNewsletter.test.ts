import {
    Category,
    JobPost,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { NewsletterPreferences } from 'report/domain/newsletterPreferences';
import { filterJobPostsForNewsletter } from './filterJobPostsForNewsletter';

const ACME = '00000000-0000-4000-8000-0000000000aa';
const OTHER = '00000000-0000-4000-8000-0000000000bb';

const basePost = (overrides: Partial<JobPost>): JobPost => ({
    id: '00000000-0000-4000-8000-000000000001',
    originalId: 'x',
    companyId: ACME,
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
    companyRules: null,
    updatedAt: 1,
});

describe('filterJobPostsForNewsletter', () => {
    it('applies publicSalaryOnly and remote workplace defaults when preferences undefined', () => {
        const withSalary = basePost({});
        const withoutSalary = basePost({
            salaryRange: null,
            id: '00000000-0000-4000-8000-000000000005',
        });
        const onSite = basePost({
            workplace: Workplace.OnSite,
            id: '00000000-0000-4000-8000-000000000006',
        });
        expect(
            filterJobPostsForNewsletter(
                [withSalary, withoutSalary, onSite],
                undefined,
            ),
        ).toEqual([withSalary]);
    });

    it('returns all posts when all dimensions are null (allow all)', () => {
        const posts = [
            basePost({}),
            basePost({
                companyId: OTHER,
                id: '00000000-0000-4000-8000-000000000002',
            }),
        ];
        expect(filterJobPostsForNewsletter(posts, allOpenPrefs())).toEqual(
            posts,
        );
    });

    it('filters by company id', () => {
        const posts = [
            basePost({ companyId: ACME }),
            basePost({
                companyId: OTHER,
                id: '00000000-0000-4000-8000-000000000002',
            }),
        ];
        const prefs: NewsletterPreferences = {
            ...allOpenPrefs(),
            allowedCompanyIds: [ACME],
        };
        const out = filterJobPostsForNewsletter(posts, prefs);
        expect(out).toHaveLength(1);
        expect(out[0].companyId).toBe(ACME);
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
            ...allOpenPrefs(),
            allowedCategorySlugs: ['frontend'],
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
            ...allOpenPrefs(),
            publicSalaryOnly: true,
        };
        const out = filterJobPostsForNewsletter(posts, prefs);
        expect(out).toHaveLength(1);
        expect(out[0].salaryRange).not.toBeNull();
    });

    it('treats missing companyRules as current AND behavior', () => {
        const remote = basePost({});
        const onSite = basePost({
            workplace: Workplace.OnSite,
            id: '00000000-0000-4000-8000-000000000006',
        });
        const prefs: NewsletterPreferences = {
            ...allOpenPrefs(),
            allowedWorkplaces: ['remote'],
            companyRules: null,
        };
        expect(filterJobPostsForNewsletter([remote, onSite], prefs)).toEqual([
            remote,
        ]);
    });

    it('includeAll keeps every offer from that company despite global filters', () => {
        const acmeOnSiteNoSalary = basePost({
            workplace: Workplace.OnSite,
            salaryRange: null,
        });
        const otherOnSiteNoSalary = basePost({
            companyId: OTHER,
            workplace: Workplace.OnSite,
            salaryRange: null,
            id: '00000000-0000-4000-8000-000000000002',
        });
        const otherRemoteSalary = basePost({
            companyId: OTHER,
            id: '00000000-0000-4000-8000-000000000003',
        });
        const prefs: NewsletterPreferences = {
            ...allOpenPrefs(),
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [{ companyId: ACME, includeAll: true }],
        };
        expect(
            filterJobPostsForNewsletter(
                [acmeOnSiteNoSalary, otherOnSiteNoSalary, otherRemoteSalary],
                prefs,
            ),
        ).toEqual([acmeOnSiteNoSalary, otherRemoteSalary]);
    });

    it('exclude drops that company', () => {
        const acme = basePost({});
        const other = basePost({
            companyId: OTHER,
            id: '00000000-0000-4000-8000-000000000002',
        });
        const prefs: NewsletterPreferences = {
            ...allOpenPrefs(),
            companyRules: [{ companyId: ACME, exclude: true }],
        };
        expect(filterJobPostsForNewsletter([acme, other], prefs)).toEqual([
            other,
        ]);
    });

    it('sparse override allowedWorkplaces null inherits publicSalaryOnly', () => {
        const acmeOnSiteWithSalary = basePost({
            workplace: Workplace.OnSite,
        });
        const acmeOnSiteNoSalary = basePost({
            workplace: Workplace.OnSite,
            salaryRange: null,
            id: '00000000-0000-4000-8000-000000000002',
        });
        const otherOnSite = basePost({
            companyId: OTHER,
            workplace: Workplace.OnSite,
            id: '00000000-0000-4000-8000-000000000003',
        });
        const prefs: NewsletterPreferences = {
            ...allOpenPrefs(),
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [{ companyId: ACME, allowedWorkplaces: null }],
        };
        expect(
            filterJobPostsForNewsletter(
                [acmeOnSiteWithSalary, acmeOnSiteNoSalary, otherOnSite],
                prefs,
            ),
        ).toEqual([acmeOnSiteWithSalary]);
    });

    it('omitted publicSalaryOnly follows the global flag', () => {
        const withoutSalary = basePost({ salaryRange: null });
        const withWorkplacesAny: NewsletterPreferences = {
            ...allOpenPrefs(),
            publicSalaryOnly: true,
            companyRules: [{ companyId: ACME, allowedWorkplaces: null }],
        };
        expect(
            filterJobPostsForNewsletter([withoutSalary], withWorkplacesAny),
        ).toEqual([]);

        const followFalse = {
            ...withWorkplacesAny,
            publicSalaryOnly: false,
        };
        expect(
            filterJobPostsForNewsletter([withoutSalary], followFalse),
        ).toEqual([withoutSalary]);
    });

    it('does not let companyRules bypass allowedCompanyIds membership', () => {
        const acme = basePost({});
        const otherNoSalary = basePost({
            companyId: OTHER,
            salaryRange: null,
            workplace: Workplace.OnSite,
            id: '00000000-0000-4000-8000-000000000002',
        });
        const prefs: NewsletterPreferences = {
            ...allOpenPrefs(),
            allowedCompanyIds: [ACME],
            publicSalaryOnly: true,
            companyRules: [{ companyId: OTHER, includeAll: true }],
        };
        expect(
            filterJobPostsForNewsletter([acme, otherNoSalary], prefs),
        ).toEqual([acme]);
    });
});
