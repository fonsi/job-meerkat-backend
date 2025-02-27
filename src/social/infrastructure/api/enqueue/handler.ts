import 'source-map-support/register';
import { checkScheduledSocialPosts } from 'social/application/checkScheduledSocialPosts';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';

export const index = async () => {
    try {
        initializeLogger();

        console.log('[CHECKING SCHEDULED SOCIAL JOB POSTS]');
        await checkScheduledSocialPosts();
        console.log('[END CHECKING SCHEDULED SOCIAL JOB POSTS]');
    } catch (e) {
        console.log(`[Error]: ${e.message}`);

        const error = errorWithPrefix(e, 'checking scheduled social job posts');
        logger.error(error);
        await logger.wait();

        return {
            statusCode: 400,
        };
    }
};
