import { maskEmail } from 'shared/infrastructure/email/maskEmail';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';

export type PreviewUnsubscribeResult =
    | { ok: true; maskedEmail: string }
    | { ok: false; reason: 'token_invalid' | 'already_unsubscribed' };

export const previewUnsubscribe = async (
    token: string | undefined,
): Promise<PreviewUnsubscribeResult> => {
    if (!token) {
        return { ok: false, reason: 'token_invalid' };
    }

    const report = await reportRepository.getByUnsubscribeToken(token);
    if (!report || !report.unsubscribeToken) {
        return { ok: false, reason: 'token_invalid' };
    }

    if (report.status === 'unsubscribed') {
        return { ok: false, reason: 'already_unsubscribed' };
    }

    return { ok: true, maskedEmail: maskEmail(report.email) };
};
