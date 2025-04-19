import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    createJobPost as createJobPostEntity,
    CreateJobPostData,
    JobPost,
} from 'jobPost/domain/jobPost';
import { Company } from 'company/domain/company';

export type CreateJobPostCommand = CreateJobPostData & {
    company: Company;
};

export const createJobPost = async (
    command: CreateJobPostCommand,
): Promise<JobPost> => {
    const jobPost = createJobPostEntity(command);

    return await jobPostRepository.create(jobPost);
};
