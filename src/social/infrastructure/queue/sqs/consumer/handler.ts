import 'source-map-support/register';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { publishSocialPost } from 'social/application/publishSocialPost';
import { ScheduledSocialPost } from 'social/domain/scheduledSocialPost';
import { ALL_SOCIAL_PLATFORMS } from 'social/domain/socialPlatform';
import { SocialPostType } from 'social/domain/socialPostType';
import { CompanyId } from 'company/domain/company';
import { JobPostId } from 'jobPost/domain/jobPost';

type LegacyEventData = {
    jobPostId: JobPostId;
    companyId: CompanyId;
};

const isScheduledSocialPost = (
    value: unknown,
): value is ScheduledSocialPost => {
    if (!value || typeof value !== 'object') {
        return false;
    }
    const post = value as ScheduledSocialPost;
    return (
        typeof post.id === 'string' &&
        typeof post.date === 'number' &&
        typeof post.type === 'string'
    );
};

const getScheduledPost = (record): ScheduledSocialPost => {
    try {
        const parsed = JSON.parse(record.body) as
            | ScheduledSocialPost
            | LegacyEventData;

        if (isScheduledSocialPost(parsed)) {
            return parsed;
        }

        const legacy = parsed as LegacyEventData;
        return {
            id: `${SocialPostType.JobPromo}_${legacy.jobPostId}_${legacy.companyId}`,
            date: Date.now(),
            type: SocialPostType.JobPromo,
            platforms: [...ALL_SOCIAL_PLATFORMS],
            jobPostId: legacy.jobPostId,
            companyId: legacy.companyId,
        };
    } catch (error) {
        throw errorWithPrefix(error, 'Error parsing SQS record body');
    }
};

export const index = async (event) => {
    try {
        initializeLogger();

        const socialPostsToPublishBatch: Promise<void>[] = event.Records.map(
            (record) => {
                const post = getScheduledPost(record);
                console.log(`[PUBLISH POST]: ${post.id}`);

                return publishSocialPost(post);
            },
        );

        await Promise.allSettled(socialPostsToPublishBatch).then((results) => {
            results.forEach((result, index) => {
                console.log(
                    `[PUBLISH POST RESULT] ${result.status}: ${JSON.stringify(result)}`,
                );
                if (result.status === 'rejected') {
                    const post = getScheduledPost(event.Records[index]);
                    logger.error(
                        errorWithPrefix(
                            new Error(result.reason),
                            `Error publishing social post: ${post.id}`,
                        ),
                    );
                }
            });
        });
    } catch (error) {
        logger.error(errorWithPrefix(error, 'Error processing SQS event'));
    } finally {
        await logger.wait();
    }

    return '[PUBLISH POST] Done';
};
