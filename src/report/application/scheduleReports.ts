import { ReportFrequency } from 'report/domain/report';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { enqueue } from 'report/infrastructure/queue/sqs/enqueue';

export const scheduleReports = async (
    frequency: ReportFrequency,
): Promise<void> => {
    const reports = await reportRepository.getAll();
    const active = reports.filter(
        (report) =>
            report.status === 'active' && report.frequency === frequency,
    );

    if (!active.length) {
        console.log(`No ${frequency} reports to schedule`);
        return;
    }

    const scheduleReportPromises = active.map((report) => {
        console.log(`Scheduling ${frequency} report: ${report.id}`);
        return enqueue({
            reportType: frequency,
            data: {
                email: report.email,
            },
        });
    });

    await Promise.all(scheduleReportPromises);
};
