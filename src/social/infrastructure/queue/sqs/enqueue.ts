import { ScheduledSocialPost } from 'social/domain/scheduledSocialPost';
import { sendMessage } from 'shared/infrastructure/queue/sqs/sendMessage';

const QUEUE_URL = process.env.PUBLISH_SOCIAL_POST_QUEUE_NAME;

export const enqueue = async (post: ScheduledSocialPost): Promise<void> =>
    await sendMessage({
        url: QUEUE_URL,
        message: JSON.stringify(post),
    });
