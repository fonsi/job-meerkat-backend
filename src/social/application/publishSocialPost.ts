import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { isCompanyDisabled } from 'company/domain/company';
import { FROM_WHEN_WEEKLY } from 'jobPost/domain/jobPostRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { openaiCreateCompanyThreadPosts } from 'shared/infrastructure/ai/openai/openaiCreateCompanyThreadPosts';
import { openaiCreateDailyAnalysisPosts } from 'shared/infrastructure/ai/openai/openaiCreateDailyAnalysisPosts';
import { openaiSocialMediaPostsCreator } from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { openaiCreateWeeklyTopPaidPosts } from 'shared/infrastructure/ai/openai/openaiCreateWeeklyTopPaidPosts';
import { logger } from 'shared/infrastructure/logger/logger';
import { buildJobPostPageUrl } from 'shared/infrastructure/url/buildJobPostPageUrl';
import { ScheduledSocialPost } from 'social/domain/scheduledSocialPost';
import { SocialPostType } from 'social/domain/socialPostType';
import { publishToPlatforms } from 'social/application/publishToPlatforms';
import {
    annualSalaryMax,
    formatSalaryLabel,
    isEligibleForSocial,
    isEligibleForSocialAnalysis,
    median,
    toJobSummary,
} from 'social/application/socialJobStats';

const publishJobPromo = async (post: ScheduledSocialPost): Promise<void> => {
    if (!post.jobPostId || !post.companyId) {
        logger.error(new Error('Job promo missing ids'), { post });
        return;
    }

    const jobPost = await jobPostRepository.getByIdAndCompanyId(
        post.jobPostId,
        post.companyId,
    );
    if (!jobPost) {
        logger.error(new Error('Job post not found'), {
            jobPostId: post.jobPostId,
            companyId: post.companyId,
        });
        return;
    }

    if (!isEligibleForSocial(jobPost)) {
        console.log(
            '[PUBLISH POST]: job promo skipped (not remote with public salary)',
            { jobPostId: post.jobPostId },
        );
        return;
    }

    const company = await companyRepository.getById(post.companyId);
    if (!company) {
        logger.error(new Error('Company not found'), {
            companyId: post.companyId,
        });
        return;
    }

    if (isCompanyDisabled(company)) {
        console.log('[PUBLISH POST]: job promo skipped (company disabled)', {
            companyId: post.companyId,
        });
        return;
    }

    const socialMediaPosts = await openaiSocialMediaPostsCreator({
        jobPost,
        company,
    });

    await publishToPlatforms({
        platforms: post.platforms,
        posts: socialMediaPosts,
    });
};

const publishDailyAnalysis = async (
    post: ScheduledSocialPost,
): Promise<void> => {
    const [latestJobPosts, companies] = await Promise.all([
        jobPostRepository.getLatest(),
        companyRepository.getAll(),
    ]);
    const companiesById = new Map(
        companies
            .filter((company) => !isCompanyDisabled(company))
            .map((c) => [c.id, c]),
    );
    const eligible = latestJobPosts.filter(
        (job) =>
            isEligibleForSocialAnalysis(job) &&
            companiesById.has(job.companyId),
    );
    if (eligible.length === 0) {
        console.log(
            '[PUBLISH POST]: no eligible jobs for daily analysis (remote, public salary, USD/EUR)',
        );
        return;
    }

    const maxJob = [...eligible].sort(
        (a, b) => annualSalaryMax(b) - annualSalaryMax(a),
    )[0];
    const currency = maxJob.salaryRange?.currency.toUpperCase() ?? 'USD';
    const sameCurrency = eligible.filter(
        (job) => job.salaryRange?.currency.toUpperCase() === currency,
    );
    const annuals = sameCurrency.map(annualSalaryMax);
    const medianValue = median(annuals);
    const maxValue = Math.max(...annuals);
    const categoryCounts = new Map<string, number>();
    for (const job of eligible) {
        categoryCounts.set(
            job.category,
            (categoryCounts.get(job.category) ?? 0) + 1,
        );
    }
    const topCategories = [...categoryCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

    const topJobs = [...eligible]
        .sort((a, b) => annualSalaryMax(b) - annualSalaryMax(a))
        .slice(0, 3)
        .map((job) =>
            toJobSummary(
                job,
                companiesById.get(job.companyId)?.name ?? 'Unknown',
            ),
        );

    const socialMediaPosts = await openaiCreateDailyAnalysisPosts({
        jobCount: eligible.length,
        companyCount: new Set(eligible.map((job) => job.companyId)).size,
        medianSalaryLabel:
            medianValue == null
                ? null
                : `~${Math.round(medianValue).toLocaleString('en-US')} ${currency}/yr`,
        maxSalaryLabel: `${Math.round(maxValue).toLocaleString('en-US')} ${currency}/yr`,
        topCategories,
        topJobs,
    });

    await publishToPlatforms({
        platforms: post.platforms,
        posts: socialMediaPosts,
    });
};

const publishWeeklyTopPaid = async (
    post: ScheduledSocialPost,
): Promise<void> => {
    const [weekJobs, companies] = await Promise.all([
        jobPostRepository.getLatestSince(FROM_WHEN_WEEKLY),
        companyRepository.getAll(),
    ]);
    const companiesById = new Map(
        companies
            .filter((company) => !isCompanyDisabled(company))
            .map((c) => [c.id, c]),
    );
    const topJobs = [...weekJobs]
        .filter(
            (job) =>
                isEligibleForSocialAnalysis(job) &&
                companiesById.has(job.companyId),
        )
        .sort((a, b) => annualSalaryMax(b) - annualSalaryMax(a))
        .slice(0, 5)
        .map((job) =>
            toJobSummary(
                job,
                companiesById.get(job.companyId)?.name ?? 'Unknown',
            ),
        );

    if (topJobs.length === 0) {
        console.log('[PUBLISH POST]: no jobs for weekly top paid');
        return;
    }

    const socialMediaPosts = await openaiCreateWeeklyTopPaidPosts({ topJobs });
    await publishToPlatforms({
        platforms: post.platforms,
        posts: socialMediaPosts,
    });
};

const publishCompanyThread = async (
    post: ScheduledSocialPost,
): Promise<void> => {
    if (!post.companyId) {
        logger.error(new Error('Company thread missing companyId'), { post });
        return;
    }

    const company = await companyRepository.getById(post.companyId);
    if (!company) {
        logger.error(new Error('Company not found'), {
            companyId: post.companyId,
        });
        return;
    }

    if (isCompanyDisabled(company)) {
        console.log(
            '[PUBLISH POST]: company thread skipped (company disabled)',
            {
                companyId: post.companyId,
            },
        );
        return;
    }

    const openJobs = await jobPostRepository.getAllOpenByCompanyId(
        post.companyId,
    );
    const eligibleJobs = openJobs.filter(isEligibleForSocialAnalysis);
    if (eligibleJobs.length === 0) {
        console.log(
            '[PUBLISH POST]: no eligible jobs for company thread (remote, public salary, USD/EUR)',
            { companyId: post.companyId },
        );
        return;
    }

    const sampleJobs = [...eligibleJobs]
        .sort((a, b) => annualSalaryMax(b) - annualSalaryMax(a))
        .slice(0, 3)
        .map((job) => ({
            title: job.title,
            salaryLabel: formatSalaryLabel(job),
            jobUrl: buildJobPostPageUrl(job.slug),
        }));

    const socialMediaPosts = await openaiCreateCompanyThreadPosts({
        company,
        openCount: eligibleJobs.length,
        jobs: sampleJobs,
    });

    await publishToPlatforms({
        platforms: post.platforms,
        posts: socialMediaPosts,
    });
};

export const publishSocialPost = async (
    post: ScheduledSocialPost,
): Promise<void> => {
    console.log(
        `[PUBLISH POST]: type=${post.type} platforms=${post.platforms.join(',')}`,
    );

    switch (post.type) {
        case SocialPostType.JobPromo:
            await publishJobPromo(post);
            return;
        case SocialPostType.DailyAnalysis:
            await publishDailyAnalysis(post);
            return;
        case SocialPostType.WeeklyTopPaid:
            await publishWeeklyTopPaid(post);
            return;
        case SocialPostType.CompanyThread:
            await publishCompanyThread(post);
            return;
        default:
            logger.error(new Error('Unknown social post type'), { post });
    }
};
