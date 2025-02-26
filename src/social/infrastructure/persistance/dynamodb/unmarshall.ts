import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import {
    ScheduledSocialPost,
    ScheduledSocialPostId,
} from 'social/domain/scheduledSocialPost';

export const unmarshall = (
    item: Record<string, AttributeValue>,
): ScheduledSocialPost => {
    try {
        return {
            id: item['id']['S'] as ScheduledSocialPostId,
            date: parseInt(item['date']['N']),
        };
    } catch (e) {
        throw new UnmarshallError(e.message, 'ScheduledSocialPost', item);
    }
};
