import { verifyMagicLinkWithReason } from 'magicLink/application/verifyMagicLink';
import { MagicLinkSubject } from 'magicLink/domain/magicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { issuePreferencesTokenForReport } from 'newsletter/infrastructure/email/sendNewsletterEmails';
import { newsletterPreferencesDefaults } from 'report/domain/newsletterPreferences';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { parseTokenFromBody } from './parseTokenFromBody';

export type ConfirmNewsletterFailureReason =
    | 'token_invalid'
    | 'token_expired'
    | 'not_found';

export type ConfirmNewsletterResult =
    | { ok: true; preferencesToken: string }
    | {
          ok: false;
          reason: ConfirmNewsletterFailureReason;
          hasToken: boolean;
          tokenLength: number;
          reportId?: string;
      };

const reportIdFromSubject = (
    subject: MagicLinkSubject | undefined,
): string | undefined =>
    subject?.type === 'report' ? subject.reportId : undefined;

const failure = ({
    reason,
    hasToken,
    tokenLength,
    reportId,
}: {
    reason: ConfirmNewsletterFailureReason;
    hasToken: boolean;
    tokenLength: number;
    reportId?: string;
}): ConfirmNewsletterResult => ({
    ok: false,
    reason,
    hasToken,
    tokenLength,
    ...(reportId ? { reportId } : {}),
});

export const confirmNewsletter = async (event: {
    body?: string | null;
}): Promise<ConfirmNewsletterResult> => {
    const token = parseTokenFromBody(event.body);
    const hasToken = Boolean(token);
    const tokenLength = token?.length ?? 0;

    if (!token) {
        return failure({ reason: 'token_invalid', hasToken, tokenLength });
    }

    const verified = await verifyMagicLinkWithReason({
        token,
        purpose: 'newsletter_confirm',
        repository: dynamodbMagicLinkRepository,
    });

    if (verified.ok === false) {
        return failure({
            reason: verified.reason,
            hasToken,
            tokenLength,
            reportId: reportIdFromSubject(verified.subject),
        });
    }

    if (verified.result.subject.type !== 'report') {
        return failure({ reason: 'token_invalid', hasToken, tokenLength });
    }

    const reportId = verified.result.subject.reportId;
    const report = await reportRepository.getById(reportId);
    if (!report) {
        return failure({
            reason: 'not_found',
            hasToken,
            tokenLength,
            reportId,
        });
    }

    if (
        normalizeEmail(report.email) !== normalizeEmail(verified.result.email)
    ) {
        return failure({
            reason: 'token_invalid',
            hasToken,
            tokenLength,
            reportId,
        });
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
        return failure({
            reason: 'token_invalid',
            hasToken,
            tokenLength,
            reportId,
        });
    }

    return { ok: true, preferencesToken };
};
