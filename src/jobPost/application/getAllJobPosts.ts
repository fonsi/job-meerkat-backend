import { CompanyId, CompanyLogo } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';

type JobPostWithCompany = JobPost & {
    company: {
        id: CompanyId;
        name: string;
        logo: CompanyLogo;
    };
};

const SIX_MONTHS = 1000 * 60 * 60 * 24 * 30 * 6;

const wasPublishedLessThanSixMonthsAgo = (jobPost: JobPost): boolean =>
    new Date().getTime() - jobPost.createdAt < SIX_MONTHS;

export const getAllJobPosts = async (): Promise<JobPostWithCompany[]> => {
    const jobPostsPromise = jobPostRepository.getAllOpen();
    const companiesPromise = companyRepository.getAll();

    return Promise.all([jobPostsPromise, companiesPromise]).then(
        ([jobPosts, companies]) => {
            return jobPosts
                .filter(wasPublishedLessThanSixMonthsAgo)
                .map((jobPost) => {
                    const company = companies.find(
                        (company) => company.id === jobPost.companyId,
                    );

                    return {
                        ...jobPost,
                        company: {
                            id: company.id,
                            name: company.name,
                            logo: company.logo,
                        },
                    };
                });
        },
    );
};
