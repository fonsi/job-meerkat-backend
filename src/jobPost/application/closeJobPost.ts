import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    JobPost,
    closeJobPost as closeJobPostEntity,
} from 'jobPost/domain/jobPost';
import { ScrappedJobPost } from 'company/infrastructure/scrapping/companyScrapper';

type CreateJobPostCommand = JobPost | ScrappedJobPost;

export const closeJobPost = async (command: CreateJobPostCommand) => {
    const { originalId, companyId } = command;
    const jobPost = await jobPostRepository.getByOriginalIdAndCompanyId(
        originalId,
        companyId,
    );

    if (!jobPost || jobPost.closedAt) {
        return;
    }

    const {
        id,
        companyId: entityCompanyId,
        closedAt,
    } = closeJobPostEntity(jobPost);

    await jobPostRepository.close(id, entityCompanyId, closedAt);
};
