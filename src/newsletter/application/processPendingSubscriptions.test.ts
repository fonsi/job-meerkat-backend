jest.mock(
    'report/infrastructure/persistance/dynamodb/dynamodbReportRepository',
    () => ({
        reportRepository: {
            getAll: jest.fn(),
            delete: jest.fn(),
            markReminderSent: jest.fn(),
        },
    }),
);
jest.mock('newsletter/infrastructure/email/sendNewsletterEmails', () => ({
    sendConfirmReminderLinkForReport: jest.fn(),
}));
jest.mock('newsletter/infrastructure/url/buildNewsletterUrls', () => ({
    buildConfirmUrl: (token: string) =>
        `https://example.com/confirm?token=${token}`,
}));

import {
    getCleanupBefore,
    getReminderBefore,
    processPendingSubscriptions,
    shouldDeletePending,
    shouldRemindPending,
} from './processPendingSubscriptions';
import { sendConfirmReminderLinkForReport } from 'newsletter/infrastructure/email/sendNewsletterEmails';
import { Report } from 'report/domain/report';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';

const DAY_MS = 1000 * 60 * 60 * 24;

const pendingReport = (overrides: Partial<Report> = {}): Report => ({
    id: 'report-1',
    email: 'user@example.com',
    emailNormalized: 'user@example.com',
    status: 'pending',
    frequency: 'daily',
    createdAt: Date.now(),
    unsubscribeToken: 'token',
    ...overrides,
});

describe('processPendingSubscriptions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 3-day reminder and 30-day cleanup cutoffs', () => {
        const now = new Date(2026, 0, 15).getTime();

        expect(getReminderBefore(now)).toBe(now - DAY_MS * 3);
        expect(getCleanupBefore(now)).toBe(now - DAY_MS * 30);
    });

    it('selects delete vs remind vs skip by age and reminderSentAt', () => {
        const now = new Date(2026, 0, 15).getTime();
        const cleanupBefore = getCleanupBefore(now);
        const reminderBefore = getReminderBefore(now);

        expect(
            shouldDeletePending(
                pendingReport({ createdAt: cleanupBefore }),
                cleanupBefore,
            ),
        ).toBe(true);
        expect(
            shouldRemindPending(
                pendingReport({ createdAt: reminderBefore }),
                reminderBefore,
                cleanupBefore,
            ),
        ).toBe(true);
        expect(
            shouldRemindPending(
                pendingReport({
                    createdAt: reminderBefore,
                    reminderSentAt: now - DAY_MS,
                }),
                reminderBefore,
                cleanupBefore,
            ),
        ).toBe(false);
        expect(
            shouldRemindPending(
                pendingReport({ createdAt: now - DAY_MS }),
                reminderBefore,
                cleanupBefore,
            ),
        ).toBe(false);
        expect(
            shouldDeletePending(
                pendingReport({ status: 'active', createdAt: cleanupBefore }),
                cleanupBefore,
            ),
        ).toBe(false);
    });

    it('deletes pending older than 30 days and reminds once after 3 days', async () => {
        const now = Date.now();
        const toDelete = pendingReport({
            id: 'old',
            createdAt: now - DAY_MS * 31,
        });
        const toRemind = pendingReport({
            id: 'mid',
            createdAt: now - DAY_MS * 4,
        });
        const alreadyReminded = pendingReport({
            id: 'reminded',
            createdAt: now - DAY_MS * 4,
            reminderSentAt: now - DAY_MS,
        });
        const tooNew = pendingReport({
            id: 'new',
            createdAt: now - DAY_MS,
        });
        const active = pendingReport({
            id: 'active',
            status: 'active',
            createdAt: now - DAY_MS * 31,
        });

        (reportRepository.getAll as jest.Mock).mockResolvedValue([
            toDelete,
            toRemind,
            alreadyReminded,
            tooNew,
            active,
        ]);
        (reportRepository.delete as jest.Mock).mockResolvedValue(undefined);
        (reportRepository.markReminderSent as jest.Mock).mockResolvedValue(
            toRemind,
        );
        (sendConfirmReminderLinkForReport as jest.Mock).mockResolvedValue(true);

        const result = await processPendingSubscriptions();

        expect(reportRepository.delete).toHaveBeenCalledWith('old');
        expect(reportRepository.delete).toHaveBeenCalledTimes(1);
        expect(sendConfirmReminderLinkForReport).toHaveBeenCalledWith(
            toRemind,
            expect.any(Function),
        );
        expect(sendConfirmReminderLinkForReport).toHaveBeenCalledTimes(1);
        expect(reportRepository.markReminderSent).toHaveBeenCalledWith('mid');
        expect(result).toEqual({
            scanned: 4,
            reminded: 1,
            deleted: 1,
            failed: 0,
        });
    });

    it('does not mark reminder when email send fails', async () => {
        const report = pendingReport({
            id: 'mid',
            createdAt: Date.now() - DAY_MS * 4,
        });

        (reportRepository.getAll as jest.Mock).mockResolvedValue([report]);
        (sendConfirmReminderLinkForReport as jest.Mock).mockResolvedValue(
            false,
        );

        const result = await processPendingSubscriptions();

        expect(reportRepository.markReminderSent).not.toHaveBeenCalled();
        expect(result).toEqual({
            scanned: 1,
            reminded: 0,
            deleted: 0,
            failed: 1,
        });
    });

    it('counts failures without stopping the batch', async () => {
        const toDelete = pendingReport({
            id: 'old',
            createdAt: Date.now() - DAY_MS * 31,
        });
        const toRemind = pendingReport({
            id: 'mid',
            createdAt: Date.now() - DAY_MS * 4,
        });

        (reportRepository.getAll as jest.Mock).mockResolvedValue([
            toDelete,
            toRemind,
        ]);
        (reportRepository.delete as jest.Mock).mockRejectedValue(
            new Error('boom'),
        );
        (sendConfirmReminderLinkForReport as jest.Mock).mockResolvedValue(true);
        (reportRepository.markReminderSent as jest.Mock).mockResolvedValue(
            toRemind,
        );

        const result = await processPendingSubscriptions();

        expect(result).toEqual({
            scanned: 2,
            reminded: 1,
            deleted: 0,
            failed: 1,
        });
    });
});
