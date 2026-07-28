import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import {
    makeScheduledSocialPostId,
    ScheduledSocialPost,
    toDateKey,
    toWeekKey,
} from 'social/domain/scheduledSocialPost';
import { ALL_SOCIAL_PLATFORMS } from 'social/domain/socialPlatform';
import { SocialPostType } from 'social/domain/socialPostType';
import {
    COMPANY_THREADS_PER_DAY,
    MAX_PUBLICATIONS_PER_DAY,
    SOCIAL_POST_SLOT_MS,
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
    }

    const jobPromoCandidates = pickBestPaidJobPerCompany(latestJobPosts);
    const usedCompanyThreadIds = new Set<string>();

    for (let i = 0; i < COMPANY_THREADS_PER_DAY; i++) {
        if (drafts.length >= MAX_PUBLICATIONS_PER_DAY) break;

        const companyForThread = pickCompanyForThread({
            jobPosts: latestJobPosts,
            companiesById,
            excludeCompanyIds: usedCompanyThreadIds,
        });
        if (!companyForThread) break;

        usedCompanyThreadIds.add(companyForThread.id);
        drafts.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.CompanyThread,
                companyId: companyForThread.id,
                dateKey,
            }),
            type: SocialPostType.CompanyThread,
            platforms: [...ALL_SOCIAL_PLATFORMS],
            companyId: companyForThread.id,
        });
    }

    for (const jobPost of jobPromoCandidates) {
        if (drafts.length >= MAX_PUBLICATIONS_PER_DAY) {
            break;
        }

        drafts.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.JobPromo,
                jobPostId: jobPost.id,
                companyId: jobPost.companyId,
            }),
            type: SocialPostType.JobPromo,
            platforms: [...ALL_SOCIAL_PLATFORMS],
            jobPostId: jobPost.id,
            companyId: jobPost.companyId,
        });
    }

    return drafts.map((draft, index) => ({
        ...draft,
        date: now + (index + 1) * SOCIAL_POST_SLOT_MS,
    }));
};
