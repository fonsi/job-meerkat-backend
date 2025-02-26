import { CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPostId } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { openaiSocialMediaPostsCreator } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { publishThread } from 'social/infrastructure/provider/meta/request';

type PublishSocialPostsData = {
    jobPostId: JobPostId;
    companyId: CompanyId;
};

export const publishSocialPosts = async ({
    jobPostId,
    companyId,
}: PublishSocialPostsData): Promise<void> => {
    const jobPost = await jobPostRepository.getByIdAndCompanyId(
        jobPostId,
        companyId,
    );
    const company = await companyRepository.getById(companyId);

    const socialMediaPosts = await openaiSocialMediaPostsCreator({
        jobPost,
        company,
    });

    await publishThread(socialMediaPosts.threads);
};
