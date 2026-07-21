import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { ScheduledSocialPost } from 'social/domain/scheduledSocialPost';

export const marshall = (
    scheduledSocialPost: ScheduledSocialPost,
): Record<string, AttributeValue> => {
    const { id, date, type, platforms, jobPostId, companyId } =
        scheduledSocialPost;

    const item: Record<string, AttributeValue> = {
        id: {
            S: id,
        },
        date: {
            N: date.toString(),
        },
        type: {
            S: type,
        },
        platforms: {
            L: platforms.map((platform) => ({ S: platform })),
        },
    };

    if (jobPostId) {
        item['jobPostId'] = { S: jobPostId };
    }

    if (companyId) {
        item['companyId'] = { S: companyId };
    }

    return item;
};
