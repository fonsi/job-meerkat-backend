import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import {
    makeScheduledSocialPostId,
    ScheduledSocialPost,
    toDateKey,
    toWeekKey,
} from 'social/domain/scheduledSocialPost';
import {
    ALL_SOCIAL_PLATFORMS,
    SOCIAL_PLATFORMS_WITHOUT_X,
    SocialPlatform,
} from 'social/domain/socialPlatform';
import { SocialPostType } from 'social/domain/socialPostType';
import {
    MAX_PUBLICATIONS_PER_DAY,
    SOCIAL_POST_SLOT_MS,
    X_DAILY_PUBLICATION_BUDGET,
} from 'social/domain/socialScheduleConfig';
import {
    annualSalaryMax,
    isEligibleForSocial,
    isEligibleForSocialAnalysis,
} from 'social/application/socialJobStats';

export const pickBestPaidJobPerCompany = (jobPosts: JobPost[]): JobPost[] => {
    const eligible = jobPosts.filter(isEligibleForSocial);
    const sorted = [...eligible].sort(
        (a, b) => annualSalaryMax(b) - annualSalaryMax(a),
    );
    const usedCompanyIds = new Set<string>();

    return sorted.filter((jobPost) => {
        if (usedCompanyIds.has(jobPost.companyId)) {
            return false;
        }
        usedCompanyIds.add(jobPost.companyId);
        return true;
    });
};

const pickCompanyForThread = ({
    jobPosts,
    companiesById,
    excludeCompanyIds,
}: {
    jobPosts: JobPost[];
    companiesById: Map<string, Company>;
    excludeCompanyIds: Set<string>;
}): Company | null => {
    const eligibleJobs = jobPosts.filter(isEligibleForSocialAnalysis);
    const openByCompany = new Map<string, number>();
    for (const job of eligibleJobs) {
        openByCompany.set(
            job.companyId,
            (openByCompany.get(job.companyId) ?? 0) + 1,
        );
    }

    const ranked = [...openByCompany.entries()]
        .filter(([companyId]) => !excludeCompanyIds.has(companyId))
        .map(([companyId, openCount]) => ({
            company: companiesById.get(companyId),
            openCount,
        }))
        .filter(
            (entry): entry is { company: Company; openCount: number } =>
                entry.company != null && Boolean(entry.company.description),
        )
        .sort((a, b) => b.openCount - a.openCount);

    return ranked[0]?.company ?? null;
};

export type BuildSocialScheduleParams = {
    latestJobPosts: JobPost[];
    weekJobPosts: JobPost[];
    companiesById: Map<string, Company>;
    now?: number;
    includeWeeklyTopPaid?: boolean;
};

export const buildSocialSchedule = ({
    latestJobPosts,
    weekJobPosts,
    companiesById,
    now = Date.now(),
    includeWeeklyTopPaid = new Date(now).getUTCDay() === 1,
}: BuildSocialScheduleParams): ScheduledSocialPost[] => {
    const dateKey = toDateKey(now);
    const drafts: Array<Omit<ScheduledSocialPost, 'date'>> = [];
    let xRemaining = X_DAILY_PUBLICATION_BUDGET;

    const analysisLatest = latestJobPosts.filter(isEligibleForSocialAnalysis);
    if (analysisLatest.length > 0) {
        drafts.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.DailyAnalysis,
                dateKey,
            }),
            type: SocialPostType.DailyAnalysis,
            platforms: [...ALL_SOCIAL_PLATFORMS],
        });
        xRemaining -= 1;
    }

    if (
        includeWeeklyTopPaid &&
        weekJobPosts.some(isEligibleForSocialAnalysis)
    ) {
        drafts.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.WeeklyTopPaid,
                weekKey: toWeekKey(now),
            }),
            type: SocialPostType.WeeklyTopPaid,
            platforms: [...ALL_SOCIAL_PLATFORMS],
        });
        xRemaining -= 1;
    }

    const jobPromoCandidates = pickBestPaidJobPerCompany(latestJobPosts);
    const companyForThread = pickCompanyForThread({
        jobPosts: latestJobPosts,
        companiesById,
        excludeCompanyIds: new Set(),
    });

    if (companyForThread && drafts.length < MAX_PUBLICATIONS_PER_DAY) {
        drafts.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.CompanyThread,
                companyId: companyForThread.id,
                dateKey,
            }),
            type: SocialPostType.CompanyThread,
            platforms: [...SOCIAL_PLATFORMS_WITHOUT_X],
            companyId: companyForThread.id,
        });
    }

    for (const jobPost of jobPromoCandidates) {
        if (drafts.length >= MAX_PUBLICATIONS_PER_DAY) {
            break;
        }

        const platforms: SocialPlatform[] =
            xRemaining > 0
                ? [...ALL_SOCIAL_PLATFORMS]
                : [...SOCIAL_PLATFORMS_WITHOUT_X];

        if (xRemaining > 0) {
            xRemaining -= 1;
        }

        drafts.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.JobPromo,
                jobPostId: jobPost.id,
                companyId: jobPost.companyId,
            }),
            type: SocialPostType.JobPromo,
            platforms,
            jobPostId: jobPost.id,
            companyId: jobPost.companyId,
        });
    }

    return drafts.map((draft, index) => ({
        ...draft,
        date: now + (index + 1) * SOCIAL_POST_SLOT_MS,
    }));
};
