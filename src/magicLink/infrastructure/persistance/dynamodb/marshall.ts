import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { StoredMagicLink } from 'magicLink/domain/magicLink';

export const marshallStoredMagicLink = (
    link: StoredMagicLink,
): Record<string, AttributeValue> => {
    const {
        tokenHash,
        subjectPurposeKey,
        purpose,
        subject,
        email,
        issuedAt,
        expiresAt,
    } = link;

    const item: Record<string, AttributeValue> = {
        tokenHash: { S: tokenHash },
        subjectPurposeKey: { S: subjectPurposeKey },
        purpose: { S: purpose },
        email: { S: email },
        issuedAt: { N: issuedAt.toString() },
        expiresAt: { N: expiresAt.toString() },
    };

    if (subject.type === 'report') {
        item['subjectType'] = { S: 'report' };
        item['reportId'] = { S: subject.reportId };
    }

    return item;
};
