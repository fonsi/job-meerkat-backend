import { JobPost } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    makeScheduledSocialPostId,
    ScheduledSocialPost,
} from 'social/domain/scheduledSocialPost';
import { scheduledSocialPostRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbScheduledSocialPostRepository';

const hasSalaryRange = (jobPost: JobPost) => !!jobPost.salaryRange?.max;

export const scheduleSocialPosts = async (): Promise<void> => {
    const latestJobPosts = await jobPostRepository.getLatest();
    const jobPostsWithSalary = latestJobPosts.filter(hasSalaryRange);

    const usedCompanyIds = new Set();
    const jobPostsSortedByBestPaid = jobPostsWithSalary.sort(
        (a, b) => b.salaryRange.max - a.salaryRange.max,
    );
    const bestPaidJobPostsByCompany = jobPostsSortedByBestPaid.filter(
        (jobPost) => {
            if (usedCompanyIds.has(jobPost.companyId)) {
                return false;
            }

            usedCompanyIds.add(jobPost.companyId);

            return true;
        },
    );

    const timeSpanBetweenPosts =
        (24 * 60 * 60 * 1000) / bestPaidJobPostsByCompany.length;
    let publishTime = Date.now();

    await Promise.allSettled(
        bestPaidJobPostsByCompany.map((jobPost) => {
            publishTime += timeSpanBetweenPosts;

            const scheduledSocialPost: ScheduledSocialPost = {
                id: makeScheduledSocialPostId({
                    jobPostId: jobPost.id,
                    companyId: jobPost.companyId,
                }),
                date: publishTime,
            };

            return scheduledSocialPostRepository.add(scheduledSocialPost);
        }),
    );
};
