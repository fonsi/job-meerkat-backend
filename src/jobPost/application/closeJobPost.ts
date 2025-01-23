import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    JobPost,
    closeJobPost as closeJobPostEntity,
} from 'jobPost/domain/jobPost';
import { ScrappedJobPost } from 'company/infrastructure/scrapping/companyScrapper';
import { logger } from 'shared/infrastructure/logger/logger';

type CloseJobPostCommand = JobPost | ScrappedJobPost;

export const closeJobPost = async (command: CloseJobPostCommand) => {
    const { originalId, companyId } = command;
    const jobPost = await jobPostRepository.getByOriginalIdAndCompanyId(
        originalId,
        companyId,
    );

    if (!jobPost || jobPost.closedAt) {
        logger.error(new Error('Error closing job post'), {
            originalId,
            companyId,
        });
        return;
    }

    const {
        id,
        companyId: entityCompanyId,
        closedAt,
    } = closeJobPostEntity(jobPost);

    await jobPostRepository.close(id, entityCompanyId, closedAt);
};
