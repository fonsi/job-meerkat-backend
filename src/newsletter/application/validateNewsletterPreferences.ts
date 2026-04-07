import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { getValidCategorySlugSet } from 'newsletter/domain/validCategorySlugs';
import {
    MAX_CATEGORY_SLUGS,
    MAX_COMPANY_IDS,
    NewsletterPreferences,
    WorkplacePreference,
} from 'report/domain/newsletterPreferences';

const WORKPLACES = new Set<WorkplacePreference>([
    'remote',
    'on-site',
    'hybrid',
]);

const dedupe = <T>(arr: T[]): T[] => [...new Set(arr)];

export type RawNewsletterPreferencesInput = {
    allowedCategorySlugs?: unknown;
    allowedCompanyIds?: unknown;
    allowedWorkplaces?: unknown;
    publicSalaryOnly?: unknown;
};

export type ValidateResult =
    | { ok: true; preferences: NewsletterPreferences }
    | { ok: false; message: string };

export const validateAndNormalizeNewsletterPreferences = async (
    input: RawNewsletterPreferencesInput,
): Promise<ValidateResult> => {
    if (typeof input.publicSalaryOnly !== 'boolean') {
        return { ok: false, message: 'publicSalaryOnly must be a boolean' };
    }

    const categoryResult = await parseCategorySlugs(input.allowedCategorySlugs);
    if (categoryResult.ok === false) {
        return { ok: false, message: categoryResult.message };
    }

    const companyResult = await parseCompanyIds(input.allowedCompanyIds);
    if (companyResult.ok === false) {
        return { ok: false, message: companyResult.message };
    }

    const workplaceResult = parseWorkplaces(input.allowedWorkplaces);
    if (workplaceResult.ok === false) {
        return { ok: false, message: workplaceResult.message };
    }

    const preferences: NewsletterPreferences = {
        allowedCategorySlugs: categoryResult.value,
        allowedCompanyIds: companyResult.value,
        allowedWorkplaces: workplaceResult.value,
        publicSalaryOnly: input.publicSalaryOnly,
        updatedAt: Date.now(),
    };

    return { ok: true, preferences };
};

type ParseOk<T> = { ok: true; value: T } | { ok: false; message: string };

const parseCategorySlugs = async (
    value: unknown,
): Promise<ParseOk<string[] | null>> => {
    if (value === null) {
        return { ok: true, value: null };
    }
    if (!Array.isArray(value)) {
        return {
            ok: false,
            message: 'allowedCategorySlugs must be null or an array',
        };
    }
    if (value.length === 0) {
        return { ok: true, value: null };
    }
    if (value.length > MAX_CATEGORY_SLUGS) {
        return {
            ok: false,
            message: `at most ${MAX_CATEGORY_SLUGS} category slugs`,
        };
    }

    for (const slug of value) {
        if (typeof slug !== 'string') {
            return {
                ok: false,
                message: 'allowedCategorySlugs must be strings',
            };
        }
    }

    const validSlugs = getValidCategorySlugSet();
    const slugs = dedupe(value as string[]);
    for (const slug of slugs) {
        if (!validSlugs.has(slug)) {
            return { ok: false, message: `unknown category slug: ${slug}` };
        }
    }

    return { ok: true, value: slugs };
};

const parseCompanyIds = async (
    value: unknown,
): Promise<ParseOk<string[] | null>> => {
    if (value === null) {
        return { ok: true, value: null };
    }
    if (!Array.isArray(value)) {
        return {
            ok: false,
            message: 'allowedCompanyIds must be null or an array',
        };
    }
    if (value.length === 0) {
        return { ok: true, value: null };
    }
    if (value.length > MAX_COMPANY_IDS) {
        return {
            ok: false,
            message: `at most ${MAX_COMPANY_IDS} company ids`,
        };
    }

    for (const id of value) {
        if (typeof id !== 'string') {
            return {
                ok: false,
                message: 'allowedCompanyIds must be strings',
            };
        }
    }

    const companies = await companyRepository.getAll();
    const validCompanyIds = new Set<string>(companies.map((c) => c.id));
    const companyIds = dedupe(value as string[]);
    for (const id of companyIds) {
        if (!validCompanyIds.has(id)) {
            return { ok: false, message: `unknown company id: ${id}` };
        }
    }

    return { ok: true, value: companyIds };
};

const parseWorkplaces = (
    value: unknown,
): ParseOk<WorkplacePreference[] | null> => {
    if (value === null) {
        return { ok: true, value: null };
    }
    if (!Array.isArray(value)) {
        return {
            ok: false,
            message: 'allowedWorkplaces must be null or an array',
        };
    }
    if (value.length === 0) {
        return { ok: true, value: null };
    }

    for (const w of value) {
        if (
            typeof w !== 'string' ||
            !WORKPLACES.has(w as WorkplacePreference)
        ) {
            return { ok: false, message: 'invalid workplace value' };
        }
    }

    return {
        ok: true,
        value: dedupe(value as WorkplacePreference[]),
    };
};
