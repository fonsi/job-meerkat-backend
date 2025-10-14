import 'source-map-support/register';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { scheduleReports } from 'report/application/scheduleReports';

export const index = async () => {
    try {
        initializeLogger();

        await scheduleReports();
    } catch (e) {
        const error = errorWithPrefix(e, 'schedule reports');
        logger.error(error);
        await logger.wait();

        return {
            statusCode: 400,
        };
    }
};
