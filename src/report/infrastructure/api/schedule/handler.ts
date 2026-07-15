import 'source-map-support/register';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { scheduleReports } from 'report/application/scheduleReports';
import { ReportFrequency } from 'report/domain/report';

const frequencyFromEnv = (): ReportFrequency => {
    const value = process.env.REPORT_SCHEDULE_FREQUENCY;
    return value === 'weekly' ? 'weekly' : 'daily';
};

export const index = async () => {
    try {
        initializeLogger();

        await scheduleReports(frequencyFromEnv());
    } catch (e) {
        const error = errorWithPrefix(e, 'schedule reports');
        logger.error(error);
        await logger.wait();

        return {
            statusCode: 400,
        };
    }
};
