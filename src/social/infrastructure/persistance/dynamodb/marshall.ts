import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { ScheduledSocialPost } from 'social/domain/scheduledSocialPost';

export const marshall = (
    scheduledSocialPost: ScheduledSocialPost,
): Record<string, AttributeValue> => {
    const { id, date } = scheduledSocialPost;

    const item = {
        id: {
            S: id,
        },
        date: {
            N: date.toString(),
        },
    };

    return item;
};
