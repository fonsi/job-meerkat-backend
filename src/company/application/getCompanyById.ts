import { Company, CompanyId, isCompanyDisabled } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';

type GetCompanyByIdParams = {
    id: CompanyId;
    includeOpenJobPosts: boolean;
};

type GetCompanyByIdResponse = {
    company: Company;
    openJobPosts?: JobPost[];
};

export const getCompanyById = async ({
    id,
    includeOpenJobPosts,
}: GetCompanyByIdParams): Promise<GetCompanyByIdResponse> => {
    const company = await companyRepository.getById(id);
    const response: GetCompanyByIdResponse = {
        company,
    };

    if (company && isCompanyDisabled(company)) {
        response.openJobPosts = [];
        return response;
    }

    if (includeOpenJobPosts) {
        response.openJobPosts =
            await jobPostRepository.getAllOpenByCompanyId(id);
    }

    return response;
};
