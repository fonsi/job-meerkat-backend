import { Company, isCompanyDisabled } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { wasPublishedLessThanSixMonthsAgo } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';

type Params = {
    countJobPosts: boolean;
};

export type CompanyWithJobPostsCount = Company & {
    jobPostsCount: number;
};

const sortActiveFirst = (companies: Company[]): Company[] =>
    [...companies].sort((a, b) => {
        const aDisabled = isCompanyDisabled(a) ? 1 : 0;
        const bDisabled = isCompanyDisabled(b) ? 1 : 0;
        return aDisabled - bDisabled;
    });

export const getAllCompanies = async ({
    countJobPosts,
}: Params): Promise<Array<Company | CompanyWithJobPostsCount>> => {
    const companies = sortActiveFirst(await companyRepository.getAll());

    if (!countJobPosts) {
        return companies;
    }

    for (let i = 0; i < companies.length; i++) {
        const company = companies[i];
        if (isCompanyDisabled(company)) {
            (company as CompanyWithJobPostsCount).jobPostsCount = 0;
            continue;
        }
        const openJobPost = await jobPostRepository.getAllOpenByCompanyId(
            company.id,
        );
        (company as CompanyWithJobPostsCount).jobPostsCount =
            openJobPost.filter(wasPublishedLessThanSixMonthsAgo).length;
    }

    return companies;
};
