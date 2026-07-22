import { Company, CompanyId, isCompanyDisabled } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { FROM_WHEN, FROM_WHEN_WEEKLY } from 'jobPost/domain/jobPostRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    buildManageSettingsLandingUrl,
    buildUnsubscribeUrl,
} from 'newsletter/infrastructure/url/buildNewsletterUrls';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';
import { ReportFrequency } from 'report/domain/report';
import { buildJobReportTemplate } from '../infrastructure/ui/email/templates/dailyReportTemplate';
import { reportRepository } from '../infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { filterJobPostsForNewsletter } from './filterJobPostsForNewsletter';

type SendReportData = {
    email: string;
    frequency: ReportFrequency;
};

export type JobPostsByCompanyType = {
    [companyId: CompanyId]: {
        company: Company;
        jobPosts: JobPost[];
    };
};

const sinceMsForFrequency = (frequency: ReportFrequency): number =>
    frequency === 'weekly' ? FROM_WHEN_WEEKLY : FROM_WHEN;

const subjectForFrequency = (
    frequency: ReportFrequency,
    totalJobPosts: number,
): string => {
    if (frequency === 'weekly') {
        return `🚀 Weekly Job Report - ${totalJobPosts} new jobs`;
    }

    return `🚀 Daily Job Report - ${totalJobPosts} new jobs`;
};

export const sendReport = async ({ email, frequency }: SendReportData) => {
    const report = await reportRepository.getByEmailNormalized(
        normalizeEmail(email),
    );

    if (!report || report.status !== 'active') {
        console.log(
            `[SEND REPORT] Skipping ${email}: not an active subscriber`,
        );
        return;
    }

    if (report.frequency !== frequency) {
        console.log(
            `[SEND REPORT] Skipping ${email}: frequency mismatch (${report.frequency} vs ${frequency})`,
        );
        return;
    }

    const latest = await jobPostRepository.getLatestSince(
        sinceMsForFrequency(frequency),
    );
    const jobPosts = filterJobPostsForNewsletter(latest, report.preferences);
    const companies = await companyRepository.getAll();
    const jobPostsByCompany: JobPostsByCompanyType = jobPosts.reduce(
        (acc, jobPost) => {
            const companyId = jobPost.companyId;
            const company = companies.find((c) => c.id === companyId);
            if (!company || isCompanyDisabled(company)) {
                return acc;
            }

            if (!acc[companyId]) {
                acc[companyId] = {
                    company,
                    jobPosts: [],
                };
            }

            acc[companyId].jobPosts.push(jobPost);

            return acc;
        },
        {} as JobPostsByCompanyType,
    );

    const totalJobPosts = Object.values(jobPostsByCompany).reduce(
        (total, companyData) => total + companyData.jobPosts.length,
        0,
    );

    if (totalJobPosts === 0) {
        console.log(
            `[SEND REPORT] Skipping ${frequency} report for ${email}: no job posts to include`,
        );
        return;
    }

    const totalCompanies = Object.keys(jobPostsByCompany).length;
    const manageUrl = buildManageSettingsLandingUrl() ?? '';
    const unsubscribeUrl = buildUnsubscribeUrl(report.unsubscribeToken) ?? '';

    const { html, text } = await buildJobReportTemplate({
        jobPostsByCompany,
        totalJobPosts,
        totalCompanies,
        frequency,
        manageUrl,
        unsubscribeUrl,
    });

    await sendEmail({
        to: [email],
        subject: subjectForFrequency(frequency, totalJobPosts),
        text,
        html,
    });
};

export const sendDailyReport = async ({ email }: { email: string }) =>
    sendReport({ email, frequency: 'daily' });

export const sendWeeklyReport = async ({ email }: { email: string }) =>
    sendReport({ email, frequency: 'weekly' });
