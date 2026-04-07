import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import {
    NewsletterPreferences,
    newsletterPreferencesDefaults,
    normalizeNewsletterPreferences,
} from 'report/domain/newsletterPreferences';
import { Report, ReportId, ReportType } from 'report/domain/report';

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

export const unmarshall = (item: Record<string, AttributeValue>): Report => {
    try {
        const preferences = parsePreferences(item['preferences']?.S);

        return {
            id: item['id']['S'] as ReportId,
            type: item['type']['S'] as ReportType,
            email: item['email']['S'],
            createdAt: parseInt(item['createdAt']['N'], 10),
            ...(preferences ? { preferences } : {}),
        };
    } catch (e) {
        throw new UnmarshallError(
            e instanceof Error ? e.message : String(e),
            'Report',
            item,
        );
    }
};
