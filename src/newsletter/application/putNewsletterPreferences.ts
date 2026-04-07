import { verifyMagicLink } from 'magicLink/application/verifyMagicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { NewsletterPreferences } from 'report/domain/newsletterPreferences';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import {
    RawNewsletterPreferencesInput,
    validateAndNormalizeNewsletterPreferences,
} from './validateNewsletterPreferences';

export type PutNewsletterPreferencesResult =
    | { ok: true; preferences: NewsletterPreferences }
    | { ok: false; reason: 'unauthorized' }
    | { ok: false; reason: 'bad_request'; message: string };

export const putNewsletterPreferences = async (event: {
    queryStringParameters?: Record<string, string> | null;
    body?: string | null;
}): Promise<PutNewsletterPreferencesResult> => {
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

    let raw: RawNewsletterPreferencesInput;
    try {
        raw = JSON.parse(event.body ?? '{}') as RawNewsletterPreferencesInput;
    } catch {
        return { ok: false, reason: 'bad_request', message: 'invalid JSON' };
    }

    const validated = await validateAndNormalizeNewsletterPreferences(raw);
    if (validated.ok === false) {
        return {
            ok: false,
            reason: 'bad_request',
            message: validated.message,
        };
    }

    const updated = await reportRepository.updatePreferences(
        report.id,
        validated.preferences,
    );

    return {
        ok: true,
        preferences: updated.preferences ?? validated.preferences,
    };
};
