import { getCategories } from 'category/application/getCategories';
import { getAllCompanies } from 'company/application/getAllCompanies';
import { verifyMagicLinkWithReason } from 'magicLink/application/verifyMagicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { ReportFrequency } from 'report/domain/report';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { mergeStoredOrDefault } from './defaultPreferences';

export type NewsletterCompanyOption = {
    id: string;
    name: string;
    logo: { url: string; background?: string };
    jobPostsCount: number;
};

export type GetNewsletterPreferencesResult =
    | {
          ok: true;
          preferences: ReturnType<typeof mergeStoredOrDefault>;
          frequency: ReportFrequency;
          email: string;
          categories: ReturnType<typeof getCategories>;
          companies: NewsletterCompanyOption[];
      }
    | { ok: false; reason: 'token_invalid' | 'token_expired' | 'not_found' };

const sortByName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });

export const getNewsletterPreferences = async (event: {
    queryStringParameters?: Record<string, string> | null;
}): Promise<GetNewsletterPreferencesResult> => {
    const token = event.queryStringParameters?.token;
    if (!token) {
        return { ok: false, reason: 'token_invalid' };
    }

    const verified = await verifyMagicLinkWithReason({
        token,
        purpose: 'newsletter_preferences',
        repository: dynamodbMagicLinkRepository,
    });

    if (verified.ok === false) {
        return { ok: false, reason: verified.reason };
    }

    if (verified.result.subject.type !== 'report') {
        return { ok: false, reason: 'token_invalid' };
    }

    const report = await reportRepository.getById(
        verified.result.subject.reportId,
    );
    if (!report || report.status !== 'active') {
        return { ok: false, reason: 'not_found' };
    }

    if (
        normalizeEmail(report.email) !== normalizeEmail(verified.result.email)
    ) {
        return { ok: false, reason: 'token_invalid' };
    }

    const categories = getCategories();
    const companies = await getAllCompanies({ countJobPosts: true });
    const preferences = mergeStoredOrDefault(report.preferences);

    if (!report.preferences) {
        await reportRepository.updatePreferences(report.id, preferences);
    }

    return {
        ok: true,
        preferences,
        frequency: report.frequency,
        email: report.email,
        categories,
        companies: companies
            .map((c) => ({
                id: c.id,
                name: c.name,
                logo: c.logo,
                jobPostsCount:
                    'jobPostsCount' in c ? (c.jobPostsCount as number) : 0,
            }))
            .sort(sortByName),
    };
};
