import { isCompanyDisabled } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { FROM_WHEN, FROM_WHEN_WEEKLY } from 'jobPost/domain/jobPostRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { buildSocialSchedule } from 'social/application/buildSocialSchedule';
import { SocialPostType } from 'social/domain/socialPostType';
import { scheduledSocialPostRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbScheduledSocialPostRepository';

export const scheduleSocialPosts = async (): Promise<void> => {
    const now = Date.now();
    const [openJobPosts, companies] = await Promise.all([
        jobPostRepository.getAllOpen(),
        companyRepository.getAll(),
    ]);
    const dailyCutoff = now - FROM_WHEN;
    const weeklyCutoff = now - FROM_WHEN_WEEKLY;
    const latestJobPosts = openJobPosts
        .filter((jobPost) => jobPost.createdAt > dailyCutoff)
        .sort((a, b) => b.createdAt - a.createdAt);
    const weekJobPosts = openJobPosts
        .filter((jobPost) => jobPost.createdAt > weeklyCutoff)
        .sort((a, b) => b.createdAt - a.createdAt);

    const companiesById = new Map(
        companies
            .filter((company) => !isCompanyDisabled(company))
            .map((company) => [company.id, company]),
    );

    const existing = await scheduledSocialPostRepository.getAll();
    // Blog promos are scheduled when a post is published; keep them across daily rebuilds.
    const pendingBlogPromoDates = existing
        .filter(
            (post) => post.date > now && post.type === SocialPostType.BlogPromo,
        )
        .map((post) => post.date);
    await Promise.all(
        existing
            .filter(
                (post) =>
                    post.date > now && post.type !== SocialPostType.BlogPromo,
            )
            .map((post) => scheduledSocialPostRepository.remove(post)),
    );

    const scheduled = buildSocialSchedule({
        latestJobPosts,
        weekJobPosts,
        openJobPosts,
        companiesById,
        now,
        extraReservedDates: pendingBlogPromoDates,
    });

    console.log(
        `Scheduling ${scheduled.length} social posts across the day. Types: ${scheduled
            .map((post) => `${post.type}[${post.platforms.join(',')}]`)
            .join(', ')}`,
    );

    await Promise.allSettled(
        scheduled.map((post) => scheduledSocialPostRepository.add(post)),
    );
};
