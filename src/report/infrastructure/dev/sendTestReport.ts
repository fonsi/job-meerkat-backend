import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import { JobPostsByCompanyType } from 'report/application/sendReport';
import { ReportFrequency } from 'report/domain/report';
import { buildJobReportTemplate } from 'report/infrastructure/ui/email/templates/dailyReportTemplate';
import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';

const TO = process.env.TEST_REPORT_TO?.trim();

type SendTestReportEvent = {
    frequency: ReportFrequency;
    manageUrl: string;
    unsubscribeUrl: string;
    companies: Array<{
        company: Company;
        jobPosts: JobPost[];
    }>;
};

/*
    Local helper to preview the daily/weekly report email with fake data.
    Invoke: npm run send-test-report
    Requires TEST_REPORT_TO in .env
*/
export const index = async (event: SendTestReportEvent) => {
    if (!TO) {
        throw new Error('TEST_REPORT_TO is not set');
    }

    const jobPostsByCompany: JobPostsByCompanyType = Object.fromEntries(
        event.companies.map(({ company, jobPosts }) => [
            company.id,
            { company, jobPosts },
        ]),
    );

    const totalJobPosts = Object.values(jobPostsByCompany).reduce(
        (total, { jobPosts }) => total + jobPosts.length,
        0,
    );
    const totalCompanies = Object.keys(jobPostsByCompany).length;

    const { html, text } = await buildJobReportTemplate({
        jobPostsByCompany,
        totalJobPosts,
        totalCompanies,
        frequency: event.frequency,
        manageUrl: event.manageUrl,
        unsubscribeUrl: event.unsubscribeUrl,
    });

    await sendEmail({
        to: [TO],
        subject: `🧪 Test ${event.frequency === 'weekly' ? 'Weekly' : 'Daily'} Job Report - ${totalJobPosts} new jobs`,
        text,
        html,
    });

    console.log(
        `[SEND TEST REPORT] Sent fake ${event.frequency} report to ${TO}`,
    );
};
