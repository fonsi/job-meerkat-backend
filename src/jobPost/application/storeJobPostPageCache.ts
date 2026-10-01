import { Company } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { toJobPostPageCache } from 'jobPost/domain/jobPostPageCache';
import { JobPost } from 'jobPost/domain/jobPost';
import { putJobPostPageCache } from 'jobPost/infrastructure/cache/s3/putJobPostPageCache';
import { jobPostDetailsRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostDetailsRepository';

export const storeJobPostPageCache = async (
    jobPost: JobPost,
    company?: Company,
): Promise<void> => {
    const resolved =
        company ?? (await companyRepository.getById(jobPost.companyId));
    if (!resolved) {
        throw new Error(
            `Company ${jobPost.companyId} not found for job post ${jobPost.slug}`,
        );
    }

    const details =
        jobPost.details ??
        (await jobPostDetailsRepository.getByJobPostId(jobPost.id));

    await putJobPostPageCache(
        toJobPostPageCache(
            { ...jobPost, ...(details ? { details } : {}) },
            resolved,
        ),
    );
};
