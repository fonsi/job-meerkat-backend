import { sendConfirmReminderLinkForReport } from 'newsletter/infrastructure/email/sendNewsletterEmails';
import { buildConfirmUrl } from 'newsletter/infrastructure/url/buildNewsletterUrls';
import { Report } from 'report/domain/report';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';

const DAY_MS = 1000 * 60 * 60 * 24;
const REMINDER_AFTER_MS = DAY_MS * 3;
const CLEANUP_AFTER_MS = DAY_MS * 30;

type ProcessPendingSubscriptionsResult = {
    scanned: number;
    reminded: number;
    deleted: number;
    failed: number;
};

export const getReminderBefore = (now: number = Date.now()): number =>
    now - REMINDER_AFTER_MS;

export const getCleanupBefore = (now: number = Date.now()): number =>
    now - CLEANUP_AFTER_MS;

export const shouldDeletePending = (
    report: Report,
    cleanupBefore: number,
): boolean => report.status === 'pending' && report.createdAt <= cleanupBefore;

export const shouldRemindPending = (
    report: Report,
    reminderBefore: number,
    cleanupBefore: number,
): boolean =>
    report.status === 'pending' &&
    report.createdAt <= reminderBefore &&
    report.createdAt > cleanupBefore &&
    report.reminderSentAt == null;

export const processPendingSubscriptions =
    async (): Promise<ProcessPendingSubscriptionsResult> => {
        const now = Date.now();
        const cleanupBefore = getCleanupBefore(now);
        const reminderBefore = getReminderBefore(now);
        const reports = await reportRepository.getAll();
        const pending = reports.filter((report) => report.status === 'pending');

        let reminded = 0;
        let deleted = 0;
        let failed = 0;

        for (const report of pending) {
            try {
                if (shouldDeletePending(report, cleanupBefore)) {
                    await reportRepository.delete(report.id);
                    deleted += 1;
                    continue;
                }

                if (
                    shouldRemindPending(report, reminderBefore, cleanupBefore)
                ) {
                    const sent = await sendConfirmReminderLinkForReport(
                        report,
                        buildConfirmUrl,
                    );
                    if (!sent) {
                        throw new Error('confirm reminder link was not sent');
                    }

                    await reportRepository.markReminderSent(report.id);
                    reminded += 1;
                }
            } catch (e) {
                failed += 1;
                console.log(
                    `[PENDING SUBSCRIPTIONS] failed processing ${report.id}: ${e.message}`,
                );
            }
        }

        return {
            scanned: pending.length,
            reminded,
            deleted,
            failed,
        };
    };
