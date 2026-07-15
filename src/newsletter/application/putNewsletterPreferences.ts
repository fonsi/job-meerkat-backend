import { verifyMagicLinkWithReason } from 'magicLink/application/verifyMagicLink';
import { dynamodbMagicLinkRepository } from 'magicLink/infrastructure/persistance/dynamodb/dynamodbMagicLinkRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { NewsletterPreferences } from 'report/domain/newsletterPreferences';
import { ReportFrequency } from 'report/domain/report';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import {
    RawNewsletterPreferencesInput,
    validateAndNormalizeNewsletterPreferences,
} from './validateNewsletterPreferences';

export type PutNewsletterPreferencesResult =
    | {
          ok: true;
          preferences: NewsletterPreferences;
          frequency: ReportFrequency;
      }
    | { ok: false; reason: 'token_invalid' | 'token_expired' | 'not_found' }
    | { ok: false; reason: 'bad_request'; message: string };

type PutBody = RawNewsletterPreferencesInput & {
    frequency?: unknown;
};

const parseFrequency = (value: unknown): ReportFrequency | null => {
    if (value === 'daily' || value === 'weekly') {
        return value;
    }

    return null;
};

export const putNewsletterPreferences = async (event: {
    queryStringParameters?: Record<string, string> | null;
    body?: string | null;
}): Promise<PutNewsletterPreferencesResult> => {
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

    let raw: PutBody;
    try {
        raw = JSON.parse(event.body ?? '{}') as PutBody;
    } catch {
        return { ok: false, reason: 'bad_request', message: 'invalid JSON' };
    }

    const frequency = parseFrequency(raw.frequency);
    if (!frequency) {
        return {
            ok: false,
            reason: 'bad_request',
            message: 'frequency must be daily or weekly',
        };
    }

    const validated = await validateAndNormalizeNewsletterPreferences(raw);
    if (validated.ok === false) {
        return {
            ok: false,
            reason: 'bad_request',
            message: validated.message,
        };
    }

    const withPrefs = await reportRepository.updatePreferences(
        report.id,
        validated.preferences,
    );
    const withFrequency = await reportRepository.updateFrequency(
        report.id,
        frequency,
    );

    return {
        ok: true,
        preferences: withPrefs.preferences ?? validated.preferences,
        frequency: withFrequency.frequency,
    };
};
