import 'source-map-support/register';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { scheduleSocialPosts } from 'social/application/scheduleSocialPosts';

export const index = async () => {
    try {
        initializeLogger();

        await scheduleSocialPosts();
    } catch (e) {
        const error = errorWithPrefix(e, 'schedule social posts');
        logger.error(error);
        await logger.wait();

        return {
            statusCode: 400,
        };
    }
};
