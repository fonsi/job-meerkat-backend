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

    const openJobPosts = await jobPostRepository.getAllOpen();
    const jobPostsCountByCompanyId = new Map<string, number>();

    for (const jobPost of openJobPosts) {
        if (!wasPublishedLessThanSixMonthsAgo(jobPost)) continue;
        jobPostsCountByCompanyId.set(
            jobPost.companyId,
            (jobPostsCountByCompanyId.get(jobPost.companyId) ?? 0) + 1,
        );
    }

    for (const company of companies) {
        (company as CompanyWithJobPostsCount).jobPostsCount = isCompanyDisabled(
            company,
        )
            ? 0
            : (jobPostsCountByCompanyId.get(company.id) ?? 0);
    }

    return companies;
};
