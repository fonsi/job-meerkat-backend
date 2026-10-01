import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    createJobPost as createJobPostEntity,
    CreateJobPostData,
    JobPost,
} from 'jobPost/domain/jobPost';
import { Company } from 'company/domain/company';
import { storeJobPostPageCache } from './storeJobPostPageCache';

export type CreateJobPostCommand = CreateJobPostData & {
    company: Company;
};

export const createJobPost = async (
    command: CreateJobPostCommand,
): Promise<JobPost> => {
    const jobPost = createJobPostEntity(command);
    await jobPostRepository.create(jobPost);
    await storeJobPostPageCache(jobPost, command.company);

    return jobPost;
};
