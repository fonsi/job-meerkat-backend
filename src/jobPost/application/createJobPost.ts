import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { createJobPost as createJobPostEntity, CreateJobPostData } from 'jobPost/domain/jobPost';

type CreateJobPostCommand = CreateJobPostData;

export const createJobPost = async (command: CreateJobPostCommand) => {
    const jobPost = createJobPostEntity(command);

    await jobPostRepository.create(jobPost);
}