import 'source-map-support/register';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import {
    sendDailyReport,
    sendWeeklyReport,
} from 'report/application/sendReport';
import { isRetriableEmailError } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';
import { ReportEventData } from '../reportEvent';

const getEventData = (record): ReportEventData => {
    try {
        return JSON.parse(record.body) as ReportEventData;
    } catch (error) {
        throw errorWithPrefix(error, 'Error parsing SQS record body');
    }
};

const toError = (reason: unknown): Error =>
    reason instanceof Error ? reason : new Error(String(reason));

export const index = async (event) => {
    initializeLogger();

    try {
        const reportsToSendBatch: Promise<void>[] = event.Records.map(
            async (record) => {
                const { reportType, data } = getEventData(record);
                console.log(`[SEND REPORT]: ${reportType} - ${data.email}`);

                switch (reportType) {
                    case 'daily':
                        await sendDailyReport({ email: data.email });
                        return;
                    case 'weekly':
                        await sendWeeklyReport({ email: data.email });
                        return;
                    default:
                        throw new Error('unknown report type');
                }
            },
        );

        const results = await Promise.allSettled(reportsToSendBatch);
        let retriableFailure: Error | undefined;

        results.forEach((result, index) => {
            console.log(
                `[SEND REPORT RESULT] ${result.status}: ${JSON.stringify(result)}`,
            );
            if (result.status !== 'rejected') return;

            const { reportType, data } = getEventData(event.Records[index]);
            const error = toError(result.reason);
            logger.error(
                errorWithPrefix(
                    error,
                    `Error sending report: ${reportType} - ${data.email}`,
                ),
            );

            if (!retriableFailure && isRetriableEmailError(result.reason)) {
                retriableFailure = error;
            }
        });

        if (retriableFailure) throw retriableFailure;
    } catch (error) {
        if (isRetriableEmailError(error)) throw error;

        logger.error(
            errorWithPrefix(toError(error), 'Error processing SQS event'),
        );
    } finally {
        await logger.wait();
    }

    return '[SEND REPORT] Done';
};
