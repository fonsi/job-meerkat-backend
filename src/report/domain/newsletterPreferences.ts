export type WorkplacePreference = 'remote' | 'on-site' | 'hybrid';

export type CompanyRule = {
    companyId: string;
    exclude?: boolean;
    includeAll?: boolean;
    /** omitted = inherit default; null = allow all; array = restrict */
    allowedCategorySlugs?: string[] | null;
    allowedWorkplaces?: WorkplacePreference[] | null;
    publicSalaryOnly?: boolean;
};

/** `null` = allow all (including categories/companies/workplaces added later). */
export type NewsletterPreferences = {
    allowedCategorySlugs: string[] | null;
    allowedCompanyIds: string[] | null;
    allowedWorkplaces: WorkplacePreference[] | null;
    publicSalaryOnly: boolean;
    companyRules: CompanyRule[] | null;
    updatedAt: number;
};

export const DEFAULT_WORKPLACES: WorkplacePreference[] = ['remote'];

export const newsletterPreferencesDefaults = (): NewsletterPreferences => ({
    allowedCategorySlugs: null,
    allowedCompanyIds: null,
    allowedWorkplaces: [...DEFAULT_WORKPLACES],
    publicSalaryOnly: true,
    companyRules: null,
    updatedAt: 0,
});

export const MAX_CATEGORY_SLUGS = 64;
export const MAX_COMPANY_IDS = 200;

export const hasOwn = (obj: object, key: PropertyKey): boolean =>
    Object.prototype.hasOwnProperty.call(obj, key);

const normalizeAllowList = <T>(value: T[] | null | undefined): T[] | null => {
    if (value == null) {
        return null;
    }
    if (Array.isArray(value) && value.length === 0) {
        return null;
    }
    return value;
};

const normalizeCompanyRule = (rule: CompanyRule): CompanyRule | null => {
    if (rule.exclude) {
        return { companyId: rule.companyId, exclude: true };
    }
    if (rule.includeAll) {
        return { companyId: rule.companyId, includeAll: true };
    }

    const out: CompanyRule = { companyId: rule.companyId };
    if (hasOwn(rule, 'allowedCategorySlugs')) {
        out.allowedCategorySlugs = normalizeAllowList(
            rule.allowedCategorySlugs,
        );
    }
    if (hasOwn(rule, 'allowedWorkplaces')) {
        out.allowedWorkplaces = normalizeAllowList(rule.allowedWorkplaces);
    }
    if (
        hasOwn(rule, 'publicSalaryOnly') &&
        typeof rule.publicSalaryOnly === 'boolean'
    ) {
        out.publicSalaryOnly = rule.publicSalaryOnly;
    }

    if (
        !hasOwn(out, 'allowedCategorySlugs') &&
        !hasOwn(out, 'allowedWorkplaces') &&
        !hasOwn(out, 'publicSalaryOnly')
    ) {
        return null;
    }

    return out;
};

export const normalizeCompanyRules = (
    rules: CompanyRule[] | null | undefined,
): CompanyRule[] | null => {
    if (rules == null || rules.length === 0) {
        return null;
    }

    const seen = new Set<string>();
    const out: CompanyRule[] = [];
    for (const rule of rules) {
        if (seen.has(rule.companyId)) {
            continue;
        }
        seen.add(rule.companyId);
        const normalized = normalizeCompanyRule(rule);
        if (normalized) {
            out.push(normalized);
        }
    }

    return out.length ? out : null;
};

/** Coerce legacy empty arrays to `null` (= allow all). */
export const normalizeNewsletterPreferences = (
    p: NewsletterPreferences,
): NewsletterPreferences => ({
    ...p,
    allowedCategorySlugs: normalizeAllowList(p.allowedCategorySlugs),
    allowedCompanyIds: normalizeAllowList(p.allowedCompanyIds),
    allowedWorkplaces: normalizeAllowList(p.allowedWorkplaces),
    companyRules: normalizeCompanyRules(p.companyRules),
});
