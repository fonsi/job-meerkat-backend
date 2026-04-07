export type WorkplacePreference = 'remote' | 'on-site' | 'hybrid';

/** `null` = allow all (including categories/companies/workplaces added later). */
export type NewsletterPreferences = {
    allowedCategorySlugs: string[] | null;
    allowedCompanyIds: string[] | null;
    allowedWorkplaces: WorkplacePreference[] | null;
    publicSalaryOnly: boolean;
    updatedAt: number;
};

export const newsletterPreferencesDefaults = (): NewsletterPreferences => ({
    allowedCategorySlugs: null,
    allowedCompanyIds: null,
    allowedWorkplaces: null,
    publicSalaryOnly: false,
    updatedAt: 0,
});

export const MAX_CATEGORY_SLUGS = 64;
export const MAX_COMPANY_IDS = 200;

const normalizeAllowList = <T>(value: T[] | null | undefined): T[] | null => {
    if (value == null) {
        return null;
    }
    if (Array.isArray(value) && value.length === 0) {
        return null;
    }
    return value;
};

/** Coerce legacy empty arrays to `null` (= allow all). */
export const normalizeNewsletterPreferences = (
    p: NewsletterPreferences,
): NewsletterPreferences => ({
    ...p,
    allowedCategorySlugs: normalizeAllowList(p.allowedCategorySlugs),
    allowedCompanyIds: normalizeAllowList(p.allowedCompanyIds),
    allowedWorkplaces: normalizeAllowList(p.allowedWorkplaces),
});
