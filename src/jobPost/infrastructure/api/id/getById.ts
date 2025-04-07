import { getJobPostById } from 'jobPost/application/getJobPostById';
import { success, notFound } from 'shared/infrastructure/api/response';

export const jobPostGetById = async (event) => {
    const jobPostId = event?.pathParameters?.id;
    const companyId = event?.pathParameters?.companyId;

    if (!jobPostId || !companyId) {
        return notFound();
    }

    const jobPost = await getJobPostById(jobPostId, companyId);

    if (!jobPost) {
        return notFound();
    }

    return success(jobPost);
};
