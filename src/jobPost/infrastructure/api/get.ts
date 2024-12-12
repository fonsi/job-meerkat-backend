import { getAllJobPosts } from 'jobPost/application/getAllJobPosts';
import { success } from 'shared/infrastructure/api/response';

export const jobPostGet = async () => {
    const jobPosts = await getAllJobPosts();

    return success(jobPosts);
}