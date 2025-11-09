import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';
import { buildDailyReportTemplate } from '../infrastructure/ui/email/templates/dailyReportTemplate';

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
    const jobPosts = await jobPostRepository.getLatest();
    const companies = await companyRepository.getAll();
    const jobPostsByCompany: JobPostsByCompanyType = jobPosts.reduce(
        (acc, jobPost) => {
            const companyId = jobPost.companyId;

            if (!acc[companyId]) {
                acc[companyId] = {
                    company: companies.find(
                        (company) => company.id === companyId,
                    ),
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
