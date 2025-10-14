import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { enqueue } from 'report/infrastructure/queue/sqs/enqueue';

export const scheduleReports = async (): Promise<void> => {
    const reports = await reportRepository.getAll();

    if (!reports.length) {
        console.log('No reports to schedule');
        return;
    }

    const scheduleReportPromises = reports.map((report) => {
        console.log(`Scheduling report: ${report.type} - ${report.id}`);
        return enqueue({
            reportType: report.type,
            data: {
                email: report.email,
            },
        });
    });

    await Promise.all(scheduleReportPromises);
};
