import 'source-map-support/register';
import { archiveClosedJobPosts } from 'jobPost/application/archiveClosedJobPosts';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';

export const index = async () => {
    try {
        initializeLogger();
        console.log('[ARCHIVING CLOSED JOB POSTS]');
        const result = await archiveClosedJobPosts();
        console.log(
            `[ARCHIVING CLOSED JOB POSTS DONE] scanned=${result.scanned} moved=${result.moved} failed=${result.failed} remaining=${result.remaining}`,
        );
        await logger.wait();
    } catch (e) {
        const error = errorWithPrefix(e, 'archive closed job posts');
        logger.error(error);
        await logger.wait();

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Something went wrong',
            }),
        };
    }
};
