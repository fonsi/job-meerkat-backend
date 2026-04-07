import {
    Category,
    JobPost,
    Workplace,
    categoryTree,
} from 'jobPost/domain/jobPost';
import { NewsletterPreferences } from 'report/domain/newsletterPreferences';

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

export const filterJobPostsForNewsletter = (
    jobPosts: JobPost[],
    preferences: NewsletterPreferences | undefined,
): JobPost[] => {
    if (!preferences) {
        return jobPosts;
    }

    let out = jobPosts;

    if (
        preferences.allowedCategorySlugs != null &&
        preferences.allowedCategorySlugs.length > 0
    ) {
        const allowed = new Set<Category>();
        for (const slug of preferences.allowedCategorySlugs) {
            const cat = SLUG_TO_CATEGORY.get(slug);
            if (cat) {
                allowed.add(cat);
            }
        }
        if (allowed.size > 0) {
            out = out.filter((j) => allowed.has(j.category));
        }
    }

    if (
        preferences.allowedCompanyIds != null &&
        preferences.allowedCompanyIds.length > 0
    ) {
        const allowed = new Set(preferences.allowedCompanyIds);
        out = out.filter((j) => allowed.has(j.companyId));
    }

    if (
        preferences.allowedWorkplaces != null &&
        preferences.allowedWorkplaces.length > 0
    ) {
        const allowed = new Set<Workplace>();
        for (const w of preferences.allowedWorkplaces) {
            const wp = WORKPLACE_FROM_PREF[w];
            if (wp) {
                allowed.add(wp);
            }
        }
        if (allowed.size > 0) {
            out = out.filter((j) => allowed.has(j.workplace));
        }
    }

    if (preferences.publicSalaryOnly) {
        out = out.filter((j) => j.salaryRange !== null);
    }

    return out;
};
