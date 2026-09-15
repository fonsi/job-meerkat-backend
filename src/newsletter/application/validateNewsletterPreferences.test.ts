import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { MAX_COMPANY_IDS } from 'report/domain/newsletterPreferences';
import { validateAndNormalizeNewsletterPreferences } from './validateNewsletterPreferences';

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
);

const ACME = '00000000-0000-4000-8000-0000000000aa';
const OTHER = '00000000-0000-4000-8000-0000000000bb';

const baseInput = {
    allowedCategorySlugs: null,
    allowedCompanyIds: null,
    allowedWorkplaces: null,
    publicSalaryOnly: true,
};

describe('validateAndNormalizeNewsletterPreferences', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (companyRepository.getAll as jest.Mock).mockResolvedValue([
            { id: ACME },
            { id: OTHER },
        ]);
    });

    it('accepts omitted companyRules as null', async () => {
        const result =
            await validateAndNormalizeNewsletterPreferences(baseInput);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.preferences.companyRules).toBeNull();
        }
    });

    it('accepts includeAll and exclude rules', async () => {
        const result = await validateAndNormalizeNewsletterPreferences({
            ...baseInput,
            companyRules: [
                { companyId: ACME, includeAll: true },
                { companyId: OTHER, exclude: true },
            ],
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.preferences.companyRules).toEqual([
                { companyId: ACME, includeAll: true },
                { companyId: OTHER, exclude: true },
            ]);
        }
    });

    it('rejects duplicate company ids', async () => {
        const result = await validateAndNormalizeNewsletterPreferences({
            ...baseInput,
            companyRules: [
                { companyId: ACME, includeAll: true },
                { companyId: ACME, exclude: true },
            ],
        });
        expect(result).toEqual({
            ok: false,
            message: 'duplicate company id in companyRules',
        });
    });

    it('rejects exclude and includeAll on the same rule', async () => {
        const result = await validateAndNormalizeNewsletterPreferences({
            ...baseInput,
            companyRules: [
                { companyId: ACME, exclude: true, includeAll: true },
            ],
        });
        expect(result).toEqual({
            ok: false,
            message: 'companyRules cannot set both exclude and includeAll',
        });
    });

    it('rejects unknown company ids', async () => {
        const result = await validateAndNormalizeNewsletterPreferences({
            ...baseInput,
            companyRules: [
                {
                    companyId: '00000000-0000-4000-8000-0000000000cc',
                    includeAll: true,
                },
            ],
        });
        expect(result).toEqual({
            ok: false,
            message: 'unknown company id: 00000000-0000-4000-8000-0000000000cc',
        });
    });

    it('rejects more than MAX_COMPANY_IDS rules', async () => {
        const companyRules = Array.from(
            { length: MAX_COMPANY_IDS + 1 },
            (_, i) => ({ companyId: `id-${i}`, includeAll: true }),
        );

        const result = await validateAndNormalizeNewsletterPreferences({
            ...baseInput,
            companyRules,
        });
        expect(result).toEqual({
            ok: false,
            message: `at most ${MAX_COMPANY_IDS} company rules`,
        });
    });

    it('keeps sparse overrides and drops empty inherit-only rules', async () => {
        const result = await validateAndNormalizeNewsletterPreferences({
            ...baseInput,
            companyRules: [
                { companyId: ACME, allowedWorkplaces: null },
                { companyId: OTHER },
            ],
        });
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.preferences.companyRules).toEqual([
                { companyId: ACME, allowedWorkplaces: null },
            ]);
        }
    });
});
