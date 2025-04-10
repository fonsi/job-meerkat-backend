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

export const getJobPostBySlug = async (
    slug: string,
): Promise<JobPostWithCompany | null> => {
    const jobPost = await jobPostRepository.getBySlug(slug);

    if (!jobPost) {
        return null;
    }

    const company = await companyRepository.getById(jobPost.companyId);

    return {
        ...jobPost,
        company: {
            id: company.id,
            name: company.name,
            logo: company.logo,
        },
    };
};
