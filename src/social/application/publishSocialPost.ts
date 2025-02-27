import { CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPostId } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { openaiSocialMediaPostsCreator } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { logger } from 'shared/infrastructure/logger/logger';
import { publishThread } from 'social/infrastructure/provider/meta/request';

type PublishSocialPostsData = {
    jobPostId: JobPostId;
    companyId: CompanyId;
};

export const publishSocialPost = async ({
    jobPostId,
    companyId,
}: PublishSocialPostsData): Promise<void> => {
    const jobPost = await jobPostRepository.getByIdAndCompanyId(
        jobPostId,
        companyId,
    );

    if (!jobPost) {
        logger.error(new Error('Job post not found'), { jobPostId, companyId });
        return;
    }

    const company = await companyRepository.getById(companyId);

    if (!company) {
        logger.error(new Error('Company not found'), { jobPostId, companyId });
        return;
    }

    console.log('[PUBLISH POST]: creating social media post content');

    const socialMediaPosts = await openaiSocialMediaPostsCreator({
        jobPost,
        company,
    });

    console.log('[PUBLISH POST]: start publishing in Threads');

    await publishThread(socialMediaPosts.threads);

    console.log('[PUBLISH POST]: published in Threads');
};
