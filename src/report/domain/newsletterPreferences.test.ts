import {
    CompanyRule,
    NewsletterPreferences,
    newsletterPreferencesDefaults,
    normalizeCompanyRules,
    normalizeNewsletterPreferences,
} from './newsletterPreferences';

const acme = '00000000-0000-4000-8000-0000000000aa';

describe('normalizeNewsletterPreferences', () => {
    it('defaults missing companyRules to null', () => {
        const prefs = newsletterPreferencesDefaults();
        expect(prefs.companyRules).toBeNull();
        expect(normalizeNewsletterPreferences(prefs).companyRules).toBeNull();
    });

    it('coerces empty companyRules to null', () => {
        const prefs: NewsletterPreferences = {
            ...newsletterPreferencesDefaults(),
            companyRules: [],
        };
        expect(normalizeNewsletterPreferences(prefs).companyRules).toBeNull();
    });

    it('strips override fields when exclude is set', () => {
        const rules: CompanyRule[] = [
            {
                companyId: acme,
                exclude: true,
                includeAll: false,
                publicSalaryOnly: true,
                allowedWorkplaces: ['remote'],
            },
        ];
        expect(normalizeCompanyRules(rules)).toEqual([
            { companyId: acme, exclude: true },
        ]);
    });

    it('strips override fields when includeAll is set', () => {
        const rules: CompanyRule[] = [
            {
                companyId: acme,
                includeAll: true,
                publicSalaryOnly: false,
                allowedCategorySlugs: ['backend'],
            },
        ];
        expect(normalizeCompanyRules(rules)).toEqual([
            { companyId: acme, includeAll: true },
        ]);
    });

    it('drops rules that only inherit the default', () => {
        expect(normalizeCompanyRules([{ companyId: acme }])).toBeNull();
    });
});
