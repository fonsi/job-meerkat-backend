import { getJobPostBySlug } from 'jobPost/application/getJobPostBySlug';
import { success, notFound } from 'shared/infrastructure/api/response';

export const jobPostGetBySlug = async (event) => {
    const slug = event?.pathParameters?.slug;

    if (!slug) {
        return notFound();
    }

    const jobPost = await getJobPostBySlug(slug);

    if (!jobPost) {
        return notFound();
    }

    return success(jobPost);
};
