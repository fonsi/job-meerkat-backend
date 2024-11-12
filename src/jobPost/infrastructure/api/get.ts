import { getAllJobPosts } from 'jobPost/application/getAllJobPosts';

export const jobPostGet = async () => {
    const jobPosts = await getAllJobPosts();

    return {
        statusCode: 200,
        body: JSON.stringify(jobPosts),
      };
}