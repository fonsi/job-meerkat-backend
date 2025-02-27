import { splitScheduledSocialPostId } from 'social/domain/scheduledSocialPost';
import { scheduledSocialPostRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbScheduledSocialPostRepository';
import { enqueue } from 'social/infrastructure/queue/sqs/enqueue';

export const checkScheduledSocialPosts = async (): Promise<void> => {
    const allScheduledPosts = await scheduledSocialPostRepository.getAll();

    if (!allScheduledPosts.length) {
        return;
    }

    const now = Date.now();

    const postsToPublish = allScheduledPosts.filter((post) => post.date <= now);

    await Promise.allSettled(
        postsToPublish.map(async (post) => {
            const { jobPostId, companyId } = splitScheduledSocialPostId(
                post.id,
            );

            await enqueue(jobPostId, companyId);
            await scheduledSocialPostRepository.remove(post);
        }),
    );
};
