import { sendPreferencesLinkForReport } from 'newsletter/infrastructure/email/sendNewsletterEmails';
import { buildSettingsUrl } from 'newsletter/infrastructure/url/buildNewsletterUrls';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { parseEmailFromBody } from './parseEmailFromBody';

export const requestNewsletterLink = async (event: {
    body?: string | null;
}): Promise<{ ok: true }> => {
    const raw = parseEmailFromBody(event.body);
    if (!raw) {
        return { ok: true };
    }

    const email = normalizeEmail(raw);
    const report = await reportRepository.getByEmailNormalized(email);

    if (!report || report.status !== 'active') {
        return { ok: true };
    }

    await sendPreferencesLinkForReport(report, buildSettingsUrl);
    return { ok: true };
};
