import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { sendEmail } from 'shared/infrastructure/notifications/email/mailgun/sendEmail';

type SendDailyReportData = {
    email: string;
};

type JobPostsByCompanyType = {
    [companyId: CompanyId]: {
        company: Company;
        jobPosts: JobPost[];
    };
};

const buildMessage = ({
    jobPostsByCompany,
    totalJobPosts,
    totalCompanies,
}: {
    jobPostsByCompany: JobPostsByCompanyType;
    totalJobPosts: number;
    totalCompanies: number;
}): string => {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Daily Job Report</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8f9fa;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #ffffff;">🚀 Daily Job Report</h1>
                            <p style="margin: 10px 0 0 0; font-size: 16px; color: #ffffff; opacity: 0.9;">Your curated list of the latest job opportunities</p>
                        </td>
                    </tr>
                    
                    <!-- Stats -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; border-bottom: 1px solid #e9ecef;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td width="50%" style="text-align: center; vertical-align: top;">
                                        <div style="font-size: 24px; font-weight: bold; color: #667eea;">${totalJobPosts}</div>
                                        <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">New Jobs</div>
                                    </td>
                                    <td width="50%" style="text-align: center; vertical-align: top;">
                                        <div style="font-size: 24px; font-weight: bold; color: #667eea;">${totalCompanies}</div>
                                        <div style="font-size: 14px; color: #6c757d; margin-top: 5px;">Companies</div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    ${Object.values(jobPostsByCompany)
                        .map(
                            ({ company, jobPosts }) => `
                    <!-- Company Section -->
                    <tr>
                        <td style="padding: 20px; border-bottom: 1px solid #e9ecef;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 15px; border-bottom: 2px solid #f8f9fa;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                ${company.logo ? `<td style="padding-right: 12px; vertical-align: top;"><img src="${company.logo.url}" alt="${company.name}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;"></td>` : ''}
                                                <td style="vertical-align: top;">
                                                    <h3 style="margin: 0; font-size: 18px; color: #2c3e50;">${company.name}</h3>
                                                    <p style="margin: 2px 0 0 0; font-size: 14px; color: #6c757d;">${jobPosts.length} new job${jobPosts.length !== 1 ? 's' : ''}</p>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 15px;">
                                        ${jobPosts
                                            .map(
                                                (jobPost) => `
                                        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px; border-left: 4px solid #667eea; margin-bottom: 12px;">
                                            <a href="${jobPost.url}" style="font-size: 16px; font-weight: 600; color: #2c3e50; text-decoration: none; display: block; margin-bottom: 8px;">${jobPost.title}</a>
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                                <tr>
                                                    <td style="font-size: 14px; color: #6c757d; padding: 2px 0;">
                                                        📍 ${jobPost.location}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style="font-size: 14px; color: #6c757d; padding: 2px 0;">
                                                        🏷️ ${jobPost.category}
                                                    </td>
                                                </tr>
                                                ${
                                                    jobPost.salaryRange
                                                        ? `
                                                <tr>
                                                    <td style="font-size: 14px; color: #28a745; font-weight: 500; padding: 2px 0;">
                                                        💰 ${jobPost.salaryRange.min ? `${jobPost.salaryRange.min}-` : ''}${jobPost.salaryRange.max} ${jobPost.salaryRange.currency}/${jobPost.salaryRange.period}
                                                    </td>
                                                </tr>
                                                `
                                                        : ''
                                                }
                                                <tr>
                                                    <td style="font-size: 14px; color: #6c757d; padding: 2px 0;">
                                                        🏠 ${jobPost.workplace}
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        `,
                                            )
                                            .join('')}
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    `,
                        )
                        .join('')}
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; border-radius: 0 0 8px 8px;">
                            <p style="margin: 0 0 10px 0;">Thanks for using JobMeerkat! 🎯</p>
                            <p style="margin: 0;">This email was sent because you subscribed to our daily job reports.</p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

const buildTextMessage = ({
    jobPostsByCompany,
    totalJobPosts,
    totalCompanies,
}: {
    jobPostsByCompany: JobPostsByCompanyType;
    totalJobPosts: number;
    totalCompanies: number;
}): string => {
    let textContent = '🚀 DAILY JOB REPORT\n';
    textContent += 'Your curated list of the latest job opportunities\n\n';
    textContent += '📊 SUMMARY\n';
    textContent += `• ${totalJobPosts} new jobs\n`;
    textContent += `• ${totalCompanies} companies\n\n`;
    textContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';

    Object.values(jobPostsByCompany).forEach(({ company, jobPosts }) => {
        textContent += `🏢 ${company.name.toUpperCase()}\n`;
        textContent += `${jobPosts.length} new job${jobPosts.length !== 1 ? 's' : ''}\n\n`;

        jobPosts.forEach((jobPost) => {
            textContent += `📋 ${jobPost.title}\n`;
            textContent += `🔗 ${jobPost.url}\n`;
            textContent += `📍 Location: ${jobPost.location}\n`;
            textContent += `🏷️  Category: ${jobPost.category}\n`;

            if (jobPost.salaryRange) {
                const salaryText = jobPost.salaryRange.min
                    ? `${jobPost.salaryRange.min}-${jobPost.salaryRange.max}`
                    : jobPost.salaryRange.max.toString();
                textContent += `💰 Salary: ${salaryText} ${jobPost.salaryRange.currency}/${jobPost.salaryRange.period}\n`;
            }

            textContent += `🏠 Workplace: ${jobPost.workplace}\n`;
            textContent += '\n';
        });

        textContent += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    });

    textContent += 'Thanks for using JobMeerkat! 🎯\n';
    textContent +=
        'This email was sent because you subscribed to our daily job reports.';

    return textContent;
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

    const htmlContent = buildMessage({
        jobPostsByCompany,
        totalJobPosts,
        totalCompanies,
    });
    const textContent = buildTextMessage({
        jobPostsByCompany,
        totalJobPosts,
        totalCompanies,
    });

    await sendEmail({
        to: [email],
        subject: `🚀 Daily Job Report - ${totalJobPosts} new jobs`,
        text: textContent,
        html: htmlContent,
    });
};
