import { Company } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';

type Params = {
    countJobPosts: boolean;
};

export type CompanyWithJobPostsCount = Company & {
    jobPostsCount: number;
};

export const getAllCompanies = async ({
    countJobPosts,
}: Params): Promise<Array<Company | CompanyWithJobPostsCount>> => {
    const companies = await companyRepository.getAll();

    if (!countJobPosts) {
        return companies;
    }

    const companiesWithJobPostsCount = companies.map((company) => {
        return {
            ...company,
            jobPostsCount: 0,
        } as CompanyWithJobPostsCount;
    });
    const jobPosts = await jobPostRepository.getAllOpen();

    jobPosts.forEach((jobPost) => {
        const company = companiesWithJobPostsCount.find(
            (company) => company.id === jobPost.companyId,
        ) as CompanyWithJobPostsCount;
        company.jobPostsCount++;
    });

    return companiesWithJobPostsCount;
};
