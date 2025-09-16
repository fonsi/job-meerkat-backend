import { CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPostId } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { openaiSocialMediaPostsCreator } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { logger } from 'shared/infrastructure/logger/logger';
import { publishOnBluesky } from 'social/infrastructure/provider/bluesky/request';
import { publishOnX } from 'social/infrastructure/provider/x/request';

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

    console.log('[PUBLISH POST]: start publishing in X');
    await publishOnX(socialMediaPosts.twitter);
    console.log('[PUBLISH POST]: published in X');

    console.log('[PUBLISH POST]: start publishing in Bluesky');
    await publishOnBluesky(socialMediaPosts.twitter);
    console.log('[PUBLISH POST]: published in Bluesky');
};
