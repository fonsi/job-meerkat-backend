import 'source-map-support/register';
import { Company } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import {
    sendDailyReport,
    sendWeeklyReport,
    sinceMsForFrequency,
} from 'report/application/sendReport';
import { ReportFrequency } from 'report/domain/report';
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

const prefetchLatestByFrequency = async (
    frequencies: Set<ReportFrequency>,
): Promise<Map<ReportFrequency, JobPost[]>> => {
    const result = new Map<ReportFrequency, JobPost[]>();
    if (frequencies.size === 0) return result;

    // Weekly window covers daily; one scan when both are in the batch.
    if (frequencies.has('weekly')) {
        const weekly = await jobPostRepository.getLatestSince(
            sinceMsForFrequency('weekly'),
        );
        result.set('weekly', weekly);
        if (frequencies.has('daily')) {
            const dailyCutoff = Date.now() - sinceMsForFrequency('daily');
            result.set(
                'daily',
                weekly.filter((jobPost) => jobPost.createdAt > dailyCutoff),
            );
        }
        return result;
    }

    result.set(
        'daily',
        await jobPostRepository.getLatestSince(sinceMsForFrequency('daily')),
    );
    return result;
};

export const index = async (event) => {
    initializeLogger();

    try {
        const parsedRecords = event.Records.map((record) => ({
            record,
            eventData: getEventData(record),
        }));
        const frequencies = new Set<ReportFrequency>(
            parsedRecords.map(({ eventData }) => eventData.reportType),
        );
        const [latestByFrequency, companies] = await Promise.all([
            prefetchLatestByFrequency(frequencies),
            companyRepository.getAll(),
        ]);

        const reportsToSendBatch: Promise<void>[] = parsedRecords.map(
            async ({ eventData }) => {
                const { reportType, data } = eventData;
                console.log(`[SEND REPORT]: ${reportType} - ${data.email}`);

                const latestJobPosts = latestByFrequency.get(reportType) ?? [];
                const shared = {
                    email: data.email,
                    latestJobPosts,
                    companies: companies as Company[],
                };

                switch (reportType) {
                    case 'daily':
                        await sendDailyReport(shared);
                        return;
                    case 'weekly':
                        await sendWeeklyReport(shared);
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

            const { reportType, data } = parsedRecords[index].eventData;
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
