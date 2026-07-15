import { sendUnsubscribeLinkEmail } from 'newsletter/infrastructure/email/sendNewsletterEmails';
import { buildUnsubscribeUrl } from 'newsletter/infrastructure/url/buildNewsletterUrls';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { parseEmailFromBody } from './parseEmailFromBody';
import { parseTokenFromBody } from './parseTokenFromBody';

export type UnsubscribeNewsletterResult =
    | { ok: true }
    | { ok: false; reason: 'token_invalid' | 'already_unsubscribed' };

export const unsubscribeNewsletter = async (event: {
    body?: string | null;
}): Promise<UnsubscribeNewsletterResult> => {
    const token = parseTokenFromBody(event.body);
    if (!token) {
        return { ok: false, reason: 'token_invalid' };
    }

    const report = await reportRepository.getByUnsubscribeToken(token);
    if (!report || report.unsubscribeToken !== token) {
        return { ok: false, reason: 'token_invalid' };
    }

    if (report.status === 'unsubscribed') {
        return { ok: false, reason: 'already_unsubscribed' };
    }

    await reportRepository.unsubscribe(report.id);
    return { ok: true };
};

export const requestUnsubscribeLink = async (event: {
    body?: string | null;
}): Promise<{ ok: true }> => {
    const raw = parseEmailFromBody(event.body);
    if (!raw) {
        return { ok: true };
    }

    const email = normalizeEmail(raw);
    const report = await reportRepository.getByEmailNormalized(email);

    if (!report || report.status !== 'active' || !report.unsubscribeToken) {
        return { ok: true };
    }

    const url = buildUnsubscribeUrl(report.unsubscribeToken);
    if (url) {
        await sendUnsubscribeLinkEmail({ to: report.email, linkUrl: url });
    }

    return { ok: true };
};
