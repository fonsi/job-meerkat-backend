import 'source-map-support/register';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { sendDailyReport } from 'report/application/sendDailyReport';
import { ReportEventData } from '../reportEvent';

const getEventData = (record): ReportEventData => {
    try {
        return JSON.parse(record.body) as ReportEventData;
    } catch (error) {
        throw errorWithPrefix(error, 'Error parsing SQS record body');
    }
};

export const index = async (event, _, callback) => {
    try {
        initializeLogger();

        const reportsToSendBatch: Promise<void>[] = event.Records.map(
            async (record) => {
                const { reportType, data } = getEventData(record);
                console.log(`[SEND REPORT]: ${reportType} - ${data.email}`);

                switch (reportType) {
                    case 'daily':
                        await sendDailyReport({ email: data.email });
                        return;
                    default:
                        throw new Error('unknown report type');
                }
            },
        );

        await Promise.allSettled(reportsToSendBatch).then((results) => {
            results.forEach((result, index) => {
                console.log(
                    `[SEND REPORT RESULT] ${result.status}: ${JSON.stringify(result)}`,
                );
                if (result.status === 'rejected') {
                    const { reportType, data } = getEventData(
                        event.Records[index],
                    );
                    logger.error(
                        errorWithPrefix(
                            new Error(result.reason),
                            `Error sendind report: ${reportType} - ${data.email}`,
                        ),
                    );
                }
            });
        });
    } catch (error) {
        logger.error(errorWithPrefix(error, 'Error processing SQS event'));
    } finally {
        await logger.wait();

        callback(null, '[SEND REPORT] Done');
    }
};
