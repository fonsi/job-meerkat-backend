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

    for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        const openJobPost = await jobPostRepository.getAllOpenByCompanyId(
            company.id,
        );
        (company as CompanyWithJobPostsCount).jobPostsCount =
            openJobPost.length;
    }

    return companies;
};
