jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
);
jest.mock(
    'report/infrastructure/persistance/dynamodb/dynamodbReportRepository',
);
jest.mock('shared/infrastructure/notifications/email/mailgun/sendEmail');
jest.mock('newsletter/infrastructure/url/buildNewsletterUrls', () => ({
    buildManageSettingsLandingUrl: () => 'https://example.com/settings',
    buildUnsubscribeUrl: (token: string) =>
        `https://example.com/unsubscribe?t=${token}`,
}));
jest.mock('../infrastructure/ui/email/templates/dailyReportTemplate', () => ({
    buildJobReportTemplate: jest.fn(async () => ({
        html: '<p>report</p>',
        text: 'report',
    })),
}));

import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';
import { buildJobReportTemplate } from '../infrastructure/ui/email/templates/dailyReportTemplate';
import { NewsletterPreferences } from 'report/domain/newsletterPreferences';
import { Report } from 'report/domain/report';
import { sendDailyReport, sendWeeklyReport } from './sendReport';
import {
    ACME,
    DISABLED,
    JobIds,
    OTHER,
    catalog,
    companies,
    openPrefs,
} from './newsletterSettings.fixtures';

const EMAIL = 'user@example.com';

const activeReport = (
    preferences?: NewsletterPreferences,
    frequency: Report['frequency'] = 'daily',
): Report => ({
    id: 'report-1',
    email: EMAIL,
    emailNormalized: EMAIL,
    status: 'active',
    frequency,
    createdAt: 1,
    unsubscribeToken: 'unsub-token',
    ...(preferences ? { preferences } : {}),
});

const includedIds = () => {
    const props = (buildJobReportTemplate as jest.Mock).mock.calls[0][0] as {
        jobPostsByCompany: Record<string, { jobPosts: { id: string }[] }>;
    };

    return Object.values(props.jobPostsByCompany)
        .flatMap((entry) => entry.jobPosts.map((job) => job.id))
        .sort();
};

describe('sendReport settings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (companyRepository.getAll as jest.Mock).mockResolvedValue(companies);
        (jobPostRepository.getLatestSince as jest.Mock).mockResolvedValue(
            catalog,
        );
        (sendEmail as jest.Mock).mockResolvedValue(undefined);
    });

    it('skips when the subscriber is not active', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue({
            ...activeReport(),
            status: 'pending',
        });

        await sendDailyReport({ email: EMAIL });

        expect(sendEmail).not.toHaveBeenCalled();
        expect(buildJobReportTemplate).not.toHaveBeenCalled();
    });

    it('skips when frequency does not match', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(undefined, 'weekly'),
        );

        await sendDailyReport({ email: EMAIL });

        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('skips when every matching job is from a disabled company', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(
                openPrefs({
                    allowedCompanyIds: [DISABLED],
                }),
            ),
        );

        await sendDailyReport({ email: EMAIL });

        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('skips when filters match no jobs', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(
                openPrefs({
                    allowedWorkplaces: ['on-site'],
                    allowedCategorySlugs: ['backend'],
                    publicSalaryOnly: true,
                    allowedCompanyIds: [OTHER],
                }),
            ),
        );

        await sendDailyReport({ email: EMAIL });

        expect(sendEmail).not.toHaveBeenCalled();
    });

    it('sends default remote + public-salary jobs and drops disabled companies', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(),
        );

        await sendDailyReport({ email: EMAIL });

        expect(includedIds()).toEqual(
            [
                JobIds.acmeRemoteSalaryBackend,
                JobIds.otherRemoteSalaryBackend,
                JobIds.otherRemoteSalaryFrontend,
            ].sort(),
        );
        expect(includedIds()).not.toContain(JobIds.disabledRemoteSalaryBackend);
        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                to: [EMAIL],
                subject: '🚀 Daily Job Report - 3 new jobs',
            }),
        );
    });

    it('sends a weekly subject when frequency is weekly', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(openPrefs(), 'weekly'),
        );

        await sendWeeklyReport({ email: EMAIL });

        expect(sendEmail).toHaveBeenCalledWith(
            expect.objectContaining({
                subject: expect.stringContaining('Weekly Job Report'),
            }),
        );
    });

    it('sends every Acme offer plus global remote+salary jobs', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(
                openPrefs({
                    allowedWorkplaces: ['remote'],
                    publicSalaryOnly: true,
                    companyRules: [{ companyId: ACME, includeAll: true }],
                }),
            ),
        );

        await sendDailyReport({ email: EMAIL });

        expect(includedIds()).toEqual(
            [
                JobIds.acmeRemoteSalaryBackend,
                JobIds.acmeOnsiteSalaryBackend,
                JobIds.acmeRemoteNoSalaryBackend,
                JobIds.acmeHybridSalaryFrontend,
                JobIds.acmeOnsiteNoSalaryFrontend,
                JobIds.otherRemoteSalaryBackend,
                JobIds.otherRemoteSalaryFrontend,
            ].sort(),
        );
        expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it('sends Acme jobs of any workplace while keeping global salary', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(
                openPrefs({
                    allowedWorkplaces: ['remote'],
                    publicSalaryOnly: true,
                    companyRules: [
                        { companyId: ACME, allowedWorkplaces: null },
                    ],
                }),
            ),
        );

        await sendDailyReport({ email: EMAIL });

        expect(includedIds()).toEqual(
            [
                JobIds.acmeRemoteSalaryBackend,
                JobIds.acmeOnsiteSalaryBackend,
                JobIds.acmeHybridSalaryFrontend,
                JobIds.otherRemoteSalaryBackend,
                JobIds.otherRemoteSalaryFrontend,
            ].sort(),
        );
    });

    it('does not send excluded company jobs', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(
                openPrefs({
                    companyRules: [{ companyId: ACME, exclude: true }],
                }),
            ),
        );

        await sendDailyReport({ email: EMAIL });

        expect(includedIds()).toEqual(
            [
                JobIds.otherRemoteSalaryBackend,
                JobIds.otherOnsiteNoSalaryFrontend,
                JobIds.otherRemoteSalaryFrontend,
                JobIds.otherHybridSalaryBackend,
            ].sort(),
        );
        expect(includedIds()).not.toContain(JobIds.acmeRemoteSalaryBackend);
    });

    it('sends only allowlisted companies', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            activeReport(openPrefs({ allowedCompanyIds: [ACME] })),
        );

        await sendDailyReport({ email: EMAIL });

        expect(includedIds()).toEqual(
            [
                JobIds.acmeRemoteSalaryBackend,
                JobIds.acmeOnsiteSalaryBackend,
                JobIds.acmeRemoteNoSalaryBackend,
                JobIds.acmeHybridSalaryFrontend,
                JobIds.acmeOnsiteNoSalaryFrontend,
            ].sort(),
        );
        expect(includedIds()).not.toContain(JobIds.otherRemoteSalaryBackend);
    });
});
