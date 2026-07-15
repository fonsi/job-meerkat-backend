import { verifyMagicLinkWithReason } from 'magicLink/application/verifyMagicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { issuePreferencesTokenForReport } from 'newsletter/infrastructure/email/sendNewsletterEmails';
import { newsletterPreferencesDefaults } from 'report/domain/newsletterPreferences';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { parseTokenFromBody } from './parseTokenFromBody';

export type ConfirmNewsletterResult =
    | { ok: true; preferencesToken: string }
    | { ok: false; reason: 'token_invalid' | 'token_expired' | 'not_found' };

export const confirmNewsletter = async (event: {
    body?: string | null;
}): Promise<ConfirmNewsletterResult> => {
    const token = parseTokenFromBody(event.body);
    if (!token) {
        return { ok: false, reason: 'token_invalid' };
    }

    const verified = await verifyMagicLinkWithReason({
        token,
        purpose: 'newsletter_confirm',
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
    if (!report) {
        return { ok: false, reason: 'not_found' };
    }

    if (
        normalizeEmail(report.email) !== normalizeEmail(verified.result.email)
    ) {
        return { ok: false, reason: 'token_invalid' };
    }

    let active =
        report.status === 'active'
            ? report
            : await reportRepository.activate(report.id);

    if (!active.preferences) {
        active = await reportRepository.updatePreferences(
            active.id,
            newsletterPreferencesDefaults(),
        );
    }

    const preferencesToken = await issuePreferencesTokenForReport(active);
    if (!preferencesToken) {
        return { ok: false, reason: 'token_invalid' };
    }

    return { ok: true, preferencesToken };
};
