import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';
import { buildDailyReportTemplate } from '../infrastructure/ui/email/templates/dailyReportTemplate';
import { reportRepository } from '../infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { filterJobPostsForNewsletter } from './filterJobPostsForNewsletter';

type SendDailyReportData = {
    email: string;
};

export type JobPostsByCompanyType = {
    [companyId: CompanyId]: {
        company: Company;
        jobPosts: JobPost[];
    };
};

export const sendDailyReport = async ({ email }: SendDailyReportData) => {
    const report = await reportRepository.getByEmailNormalized(
        normalizeEmail(email),
    );
    const latest = await jobPostRepository.getLatest();
    const jobPosts = filterJobPostsForNewsletter(latest, report?.preferences);
    const companies = await companyRepository.getAll();
    const jobPostsByCompany: JobPostsByCompanyType = jobPosts.reduce(
        (acc, jobPost) => {
            const companyId = jobPost.companyId;
            const company = companies.find((c) => c.id === companyId);
            if (!company) {
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
            `[SEND REPORT] Skipping daily report for ${email}: no job posts to include`,
        );
        return;
    }

    const totalCompanies = Object.keys(jobPostsByCompany).length;

    const { html, text } = await buildDailyReportTemplate({
        jobPostsByCompany,
        totalJobPosts,
        totalCompanies,
    });

    await sendEmail({
        to: [email],
        subject: `🚀 Daily Job Report - ${totalJobPosts} new jobs`,
        text,
        html,
    });
};
