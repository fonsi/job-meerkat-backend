import {
    Category,
    JobPost,
    Workplace,
    categoryTree,
} from 'jobPost/domain/jobPost';
import {
    CompanyRule,
    NewsletterPreferences,
    WorkplacePreference,
    hasOwn,
    newsletterPreferencesDefaults,
} from 'report/domain/newsletterPreferences';

type FilterDimensions = {
    allowedCategorySlugs: string[] | null;
    allowedWorkplaces: WorkplacePreference[] | null;
    publicSalaryOnly: boolean;
};

const buildSlugToCategoryMap = (): Map<string, Category> => {
    const m = new Map<string, Category>();
    for (const group of categoryTree) {
        for (const c of group.categories) {
            m.set(c.slug, c.name);
        }
    }
    return m;
};

const SLUG_TO_CATEGORY = buildSlugToCategoryMap();

const WORKPLACE_FROM_PREF: Record<string, Workplace> = {
    remote: Workplace.Remote,
    'on-site': Workplace.OnSite,
    hybrid: Workplace.Hybrid,
};

function pickList(
    rule: CompanyRule | undefined,
    key: 'allowedCategorySlugs',
    fallback: string[] | null,
): string[] | null;
function pickList(
    rule: CompanyRule | undefined,
    key: 'allowedWorkplaces',
    fallback: WorkplacePreference[] | null,
): WorkplacePreference[] | null;
function pickList(
    rule: CompanyRule | undefined,
    key: 'allowedCategorySlugs' | 'allowedWorkplaces',
    fallback: string[] | WorkplacePreference[] | null,
): string[] | WorkplacePreference[] | null {
    if (rule && hasOwn(rule, key) && rule[key] !== undefined) {
        return rule[key] as string[] | WorkplacePreference[] | null;
    }
    return fallback;
}

const pickSalary = (
    rule: CompanyRule | undefined,
    fallback: boolean,
): boolean => {
    if (
        rule &&
        hasOwn(rule, 'publicSalaryOnly') &&
        typeof rule.publicSalaryOnly === 'boolean'
    ) {
        return rule.publicSalaryOnly;
    }

    return fallback;
};

const jobMatchesDimensions = (
    job: JobPost,
    dims: FilterDimensions,
): boolean => {
    if (
        dims.allowedCategorySlugs != null &&
        dims.allowedCategorySlugs.length > 0
    ) {
        const allowed = new Set<Category>();
        for (const slug of dims.allowedCategorySlugs) {
            const cat = SLUG_TO_CATEGORY.get(slug);
            if (cat) {
                allowed.add(cat);
            }
        }
        if (allowed.size > 0 && !allowed.has(job.category)) {
            return false;
        }
    }

    if (dims.allowedWorkplaces != null && dims.allowedWorkplaces.length > 0) {
        const allowed = new Set<Workplace>();
        for (const w of dims.allowedWorkplaces) {
            const wp = WORKPLACE_FROM_PREF[w];
            if (wp) {
                allowed.add(wp);
            }
        }
        if (allowed.size > 0 && !allowed.has(job.workplace)) {
            return false;
        }
    }

    if (dims.publicSalaryOnly && job.salaryRange === null) {
        return false;
    }

    return true;
};

export const filterJobPostsForNewsletter = (
    jobPosts: JobPost[],
    preferences: NewsletterPreferences | undefined,
): JobPost[] => {
    const prefs = preferences ?? newsletterPreferencesDefaults();
    const allowedCompanies =
        prefs.allowedCompanyIds != null && prefs.allowedCompanyIds.length > 0
            ? new Set(prefs.allowedCompanyIds)
            : null;
    const rulesByCompany = new Map(
        (prefs.companyRules ?? []).map((r) => [r.companyId, r]),
    );

    return jobPosts.filter((job) => {
        if (allowedCompanies && !allowedCompanies.has(job.companyId)) {
            return false;
        }

        const rule = rulesByCompany.get(job.companyId);
        if (rule?.exclude) {
            return false;
        }
        if (rule?.includeAll) {
            return true;
        }

        const dims: FilterDimensions = {
            allowedCategorySlugs: pickList(
                rule,
                'allowedCategorySlugs',
                prefs.allowedCategorySlugs,
            ),
            allowedWorkplaces: pickList(
                rule,
                'allowedWorkplaces',
                prefs.allowedWorkplaces,
            ),
            publicSalaryOnly: pickSalary(rule, prefs.publicSalaryOnly),
        };

        return jobMatchesDimensions(job, dims);
    });
};
