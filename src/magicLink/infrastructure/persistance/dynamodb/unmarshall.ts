import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import {
    MagicLinkPurpose,
    MagicLinkSubject,
    StoredMagicLink,
} from 'magicLink/domain/magicLink';

const toSubject = (item: Record<string, AttributeValue>): MagicLinkSubject => {
    const subjectType = item['subjectType']?.S;
    if (subjectType === 'report') {
        return {
            type: 'report',
            reportId: item['reportId']?.S ?? '',
        };
    }

    throw new UnmarshallError('unknown subjectType', 'MagicLink', item);
};

export const unmarshallStoredMagicLink = (
    item: Record<string, AttributeValue>,
): StoredMagicLink => {
    try {
        const subject = toSubject(item);
        return {
            tokenHash: item['tokenHash']['S'],
            subjectPurposeKey: item['subjectPurposeKey']['S'],
            purpose: item['purpose']['S'] as MagicLinkPurpose,
            subject,
            email: item['email']['S'],
            issuedAt: parseInt(item['issuedAt']['N'], 10),
            expiresAt: parseInt(item['expiresAt']['N'], 10),
        };
    } catch (e) {
        throw new UnmarshallError(
            e instanceof Error ? e.message : String(e),
            'MagicLink',
            item,
        );
    }
};
