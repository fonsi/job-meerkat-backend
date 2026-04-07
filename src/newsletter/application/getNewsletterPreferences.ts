import { getCategories } from 'category/application/getCategories';
import { verifyMagicLink } from 'magicLink/application/verifyMagicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { mergeStoredOrDefault } from './defaultPreferences';

export type GetNewsletterPreferencesResult =
    | {
          ok: true;
          preferences: ReturnType<typeof mergeStoredOrDefault>;
          categories: ReturnType<typeof getCategories>;
          companies: Array<{ id: string; name: string }>;
      }
    | { ok: false; reason: 'unauthorized' };

export const getNewsletterPreferences = async (event: {
    queryStringParameters?: Record<string, string> | null;
}): Promise<GetNewsletterPreferencesResult> => {
    const token = event.queryStringParameters?.token;
    if (!token) {
        return { ok: false, reason: 'unauthorized' };
    }

    const verified = await verifyMagicLink({
        token,
        purpose: 'newsletter_preferences',
        repository: dynamodbMagicLinkRepository,
    });

    if (!verified || verified.subject.type !== 'report') {
        return { ok: false, reason: 'unauthorized' };
    }

    const report = await reportRepository.getById(verified.subject.reportId);
    if (!report) {
        return { ok: false, reason: 'unauthorized' };
    }

    if (normalizeEmail(report.email) !== normalizeEmail(verified.email)) {
        return { ok: false, reason: 'unauthorized' };
    }

    const categories = getCategories();
    const companies = await companyRepository.getAll();

    return {
        ok: true,
        preferences: mergeStoredOrDefault(report.preferences),
        categories,
        companies: companies.map((c) => ({ id: c.id, name: c.name })),
    };
};
