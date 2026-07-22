import { isCompanyDisabled } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { FROM_WHEN_WEEKLY } from 'jobPost/domain/jobPostRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { buildSocialSchedule } from 'social/application/buildSocialSchedule';
import { scheduledSocialPostRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbScheduledSocialPostRepository';

export const scheduleSocialPosts = async (): Promise<void> => {
    const now = Date.now();
    const [latestJobPosts, weekJobPosts, companies] = await Promise.all([
        jobPostRepository.getLatest(),
        jobPostRepository.getLatestSince(FROM_WHEN_WEEKLY),
        companyRepository.getAll(),
    ]);

    const companiesById = new Map(
        companies
            .filter((company) => !isCompanyDisabled(company))
            .map((company) => [company.id, company]),
    );

    const existing = await scheduledSocialPostRepository.getAll();
    await Promise.all(
        existing
            .filter((post) => post.date > now)
            .map((post) => scheduledSocialPostRepository.remove(post)),
    );

    const scheduled = buildSocialSchedule({
        latestJobPosts,
        weekJobPosts,
        companiesById,
        now,
    });

    console.log(
        `Scheduling ${scheduled.length} social posts (~1/hour). Types: ${scheduled
            .map((post) => `${post.type}[${post.platforms.join(',')}]`)
            .join(', ')}`,
    );

    await Promise.allSettled(
        scheduled.map((post) => scheduledSocialPostRepository.add(post)),
    );
};
