import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    JobPost,
    closeJobPost as closeJobPostEntity,
} from 'jobPost/domain/jobPost';
import { logger } from 'shared/infrastructure/logger/logger';

type CloseJobPostCommand = JobPost;

export const closeJobPost = async (command: CloseJobPostCommand) => {
    const { id, companyId } = command;
    const jobPost = await jobPostRepository.getByIdAndCompanyId(id, companyId);

    if (!jobPost) {
        logger.error(new Error('Error closing job post - Not found'), {
            id,
            companyId,
        });
        return;
    }

    if (jobPost.closedAt) {
        logger.error(new Error('Error closing job post - Already closed'), {
            id,
            companyId,
        });
        return;
    }

    const { closedAt } = closeJobPostEntity(jobPost);

    await jobPostRepository.close(id, companyId, closedAt);
};
