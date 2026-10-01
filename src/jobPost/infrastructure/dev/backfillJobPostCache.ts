import 'source-map-support/register';
import { backfillJobPostPageCache } from 'jobPost/application/backfillJobPostPageCache';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';

export const index = async () => {
    initializeLogger();

    try {
        const result = await backfillJobPostPageCache();
        console.log(JSON.stringify(result));
        return result;
    } catch (error) {
        const prefixedError = errorWithPrefix(error, 'backfill job post cache');
        logger.error(prefixedError);
        await logger.wait();
        throw prefixedError;
    }
};
