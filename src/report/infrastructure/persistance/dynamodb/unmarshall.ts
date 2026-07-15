import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import {
    NewsletterPreferences,
    newsletterPreferencesDefaults,
    normalizeNewsletterPreferences,
} from 'report/domain/newsletterPreferences';
import {
    Report,
    ReportFrequency,
    ReportId,
    SubscriptionStatus,
} from 'report/domain/report';

const parsePreferences = (
    raw: string | undefined,
): NewsletterPreferences | undefined => {
    if (!raw) {
        return undefined;
    }

    try {
        const parsed = JSON.parse(raw) as Partial<NewsletterPreferences>;
        return normalizeNewsletterPreferences({
            ...newsletterPreferencesDefaults(),
            ...parsed,
        });
    } catch {
        return undefined;
    }
};

const parseStatus = (
    raw: string | undefined,
    legacyType: string | undefined,
): SubscriptionStatus => {
    if (raw === 'pending' || raw === 'active' || raw === 'unsubscribed') {
        return raw;
    }

    return legacyType ? 'active' : 'active';
};

const parseFrequency = (
    raw: string | undefined,
    legacyType: string | undefined,
): ReportFrequency => {
    if (raw === 'daily' || raw === 'weekly') {
        return raw;
    }

    if (legacyType === 'daily' || legacyType === 'weekly') {
        return legacyType;
    }

    return 'daily';
};

export const unmarshall = (item: Record<string, AttributeValue>): Report => {
    try {
        const email = item['email']['S'];
        const preferences = parsePreferences(item['preferences']?.S);
        const legacyType = item['type']?.S;

        const report: Report = {
            id: item['id']['S'] as ReportId,
            email,
            emailNormalized:
                item['emailNormalized']?.S ?? normalizeEmail(email),
            status: parseStatus(item['status']?.S, legacyType),
            frequency: parseFrequency(item['frequency']?.S, legacyType),
            createdAt: parseInt(item['createdAt']['N'], 10),
            unsubscribeToken: item['unsubscribeToken']?.S ?? '',
            ...(item['confirmedAt']?.N
                ? { confirmedAt: parseInt(item['confirmedAt']['N'], 10) }
                : {}),
            ...(item['unsubscribedAt']?.N
                ? {
                      unsubscribedAt: parseInt(item['unsubscribedAt']['N'], 10),
                  }
                : {}),
            ...(preferences ? { preferences } : {}),
        };

        return report;
    } catch (e) {
        throw new UnmarshallError(
            e instanceof Error ? e.message : String(e),
            'Report',
            item,
        );
    }
};
