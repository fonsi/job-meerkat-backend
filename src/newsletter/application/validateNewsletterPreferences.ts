import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { getValidCategorySlugSet } from 'newsletter/domain/validCategorySlugs';
import {
    CompanyRule,
    MAX_CATEGORY_SLUGS,
    MAX_COMPANY_IDS,
    NewsletterPreferences,
    WorkplacePreference,
    hasOwn,
    normalizeCompanyRules,
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
    companyRules?: unknown;
};

export type ValidateResult =
    | { ok: true; preferences: NewsletterPreferences }
    | { ok: false; message: string };

type ParseOk<T> = { ok: true; value: T } | { ok: false; message: string };

export const validateAndNormalizeNewsletterPreferences = async (
    input: RawNewsletterPreferencesInput,
): Promise<ValidateResult> => {
    if (typeof input.publicSalaryOnly !== 'boolean') {
        return { ok: false, message: 'publicSalaryOnly must be a boolean' };
    }

    const categoryResult = parseCategorySlugs(input.allowedCategorySlugs);
    if (categoryResult.ok === false) {
        return { ok: false, message: categoryResult.message };
    }

    const validCompanyIds = await loadValidCompanyIds();

    const companyResult = parseCompanyIds(
        input.allowedCompanyIds,
        validCompanyIds,
    );
    if (companyResult.ok === false) {
        return { ok: false, message: companyResult.message };
    }

    const workplaceResult = parseWorkplaces(input.allowedWorkplaces);
    if (workplaceResult.ok === false) {
        return { ok: false, message: workplaceResult.message };
    }

    const rulesResult = parseCompanyRules(input.companyRules, validCompanyIds);
    if (rulesResult.ok === false) {
        return { ok: false, message: rulesResult.message };
    }

    const preferences: NewsletterPreferences = {
        allowedCategorySlugs: categoryResult.value,
        allowedCompanyIds: companyResult.value,
        allowedWorkplaces: workplaceResult.value,
        publicSalaryOnly: input.publicSalaryOnly,
        companyRules: normalizeCompanyRules(rulesResult.value),
        updatedAt: Date.now(),
    };

    return { ok: true, preferences };
};

const loadValidCompanyIds = async (): Promise<Set<string>> => {
    const companies = await companyRepository.getAll();
    return new Set<string>(companies.map((c) => c.id));
};

const parseCategorySlugs = (value: unknown): ParseOk<string[] | null> => {
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

const parseCompanyIds = (
    value: unknown,
    validCompanyIds: Set<string>,
): ParseOk<string[] | null> => {
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

const parseCompanyRules = (
    value: unknown,
    validCompanyIds: Set<string>,
): ParseOk<CompanyRule[] | null> => {
    if (value === undefined || value === null) {
        return { ok: true, value: null };
    }
    if (!Array.isArray(value)) {
        return {
            ok: false,
            message: 'companyRules must be null or an array',
        };
    }
    if (value.length === 0) {
        return { ok: true, value: null };
    }
    if (value.length > MAX_COMPANY_IDS) {
        return {
            ok: false,
            message: `at most ${MAX_COMPANY_IDS} company rules`,
        };
    }

    const seen = new Set<string>();
    const rules: CompanyRule[] = [];

    for (const raw of value) {
        const parsed = parseCompanyRule(raw, seen, validCompanyIds);
        if (parsed.ok === false) {
            return parsed;
        }
        rules.push(parsed.value);
    }

    return { ok: true, value: rules };
};

const parseCompanyRule = (
    raw: unknown,
    seen: Set<string>,
    validCompanyIds: Set<string>,
): ParseOk<CompanyRule> => {
    if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, message: 'companyRules must be objects' };
    }

    const rec = raw as Record<string, unknown>;
    if (typeof rec.companyId !== 'string') {
        return {
            ok: false,
            message: 'companyRules.companyId must be a string',
        };
    }
    if (seen.has(rec.companyId)) {
        return {
            ok: false,
            message: 'duplicate company id in companyRules',
        };
    }
    seen.add(rec.companyId);
    if (!validCompanyIds.has(rec.companyId)) {
        return { ok: false, message: `unknown company id: ${rec.companyId}` };
    }

    if (rec.exclude !== undefined && typeof rec.exclude !== 'boolean') {
        return { ok: false, message: 'companyRules.exclude must be a boolean' };
    }
    if (rec.includeAll !== undefined && typeof rec.includeAll !== 'boolean') {
        return {
            ok: false,
            message: 'companyRules.includeAll must be a boolean',
        };
    }
    if (rec.exclude === true && rec.includeAll === true) {
        return {
            ok: false,
            message: 'companyRules cannot set both exclude and includeAll',
        };
    }

    if (rec.exclude === true) {
        return { ok: true, value: { companyId: rec.companyId, exclude: true } };
    }
    if (rec.includeAll === true) {
        return {
            ok: true,
            value: { companyId: rec.companyId, includeAll: true },
        };
    }

    return parseCompanyRuleOverrides(rec);
};

const parseCompanyRuleOverrides = (
    rec: Record<string, unknown>,
): ParseOk<CompanyRule> => {
    const rule: CompanyRule = { companyId: rec.companyId as string };

    if (
        hasOwn(rec, 'allowedCategorySlugs') &&
        rec.allowedCategorySlugs !== undefined
    ) {
        const categoryResult = parseCategorySlugs(rec.allowedCategorySlugs);
        if (categoryResult.ok === false) {
            return categoryResult;
        }
        rule.allowedCategorySlugs = categoryResult.value;
    }

    if (
        hasOwn(rec, 'allowedWorkplaces') &&
        rec.allowedWorkplaces !== undefined
    ) {
        const workplaceResult = parseWorkplaces(rec.allowedWorkplaces);
        if (workplaceResult.ok === false) {
            return workplaceResult;
        }
        rule.allowedWorkplaces = workplaceResult.value;
    }

    if (hasOwn(rec, 'publicSalaryOnly') && rec.publicSalaryOnly !== undefined) {
        if (typeof rec.publicSalaryOnly !== 'boolean') {
            return {
                ok: false,
                message: 'companyRules.publicSalaryOnly must be a boolean',
            };
        }
        rule.publicSalaryOnly = rec.publicSalaryOnly;
    }

    return { ok: true, value: rule };
};
