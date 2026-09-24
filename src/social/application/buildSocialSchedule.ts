import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import { nextZonedHour } from 'social/domain/nextZonedHour';
import {
    makeScheduledSocialPostId,
    ScheduledSocialPost,
    toDateKey,
    toWeekKey,
} from 'social/domain/scheduledSocialPost';
import { ALL_SOCIAL_PLATFORMS } from 'social/domain/socialPlatform';
import { SocialPostType } from 'social/domain/socialPostType';
import {
    companyThreadCountForPromos,
    DAILY_ANALYSIS_HOUR,
    MAX_PUBLICATIONS_PER_DAY,
    NEWSLETTER_SUBSCRIBE_HOUR,
    NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS,
    SOCIAL_POST_SLOT_MS,
    SOCIAL_SCHEDULE_TIME_ZONE,
    WEEKLY_TOP_PAID_HOUR,
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

const pickCompaniesForThreads = ({
    jobPosts,
    companiesById,
    excludeCompanyIds,
    limit,
}: {
    jobPosts: JobPost[];
    companiesById: Map<string, Company>;
    excludeCompanyIds: Set<string>;
    limit: number;
}): Company[] => {
    const picked: Company[] = [];
    while (picked.length < limit) {
        const companyForThread = pickCompanyForThread({
            jobPosts,
            companiesById,
            excludeCompanyIds,
        });
        if (!companyForThread) break;

        excludeCompanyIds.add(companyForThread.id);
        picked.push(companyForThread);
    }

    return picked;
};

const interleaveEvenly = <T>(main: T[], toSpread: T[]): T[] => {
    if (toSpread.length === 0) return [...main];
    if (main.length === 0) return [...toSpread];

    const result: T[] = [];
    const gap = Math.floor(main.length / (toSpread.length + 1));
    if (gap === 0) {
        const longest = Math.max(main.length, toSpread.length);
        for (let i = 0; i < longest; i++) {
            if (i < toSpread.length) result.push(toSpread[i]);
            if (i < main.length) result.push(main[i]);
        }

        return result;
    }
    let spreadIndex = 0;

    for (let i = 0; i < main.length; i++) {
        result.push(main[i]);
        if (
            spreadIndex < toSpread.length &&
            (i + 1) % gap === 0 &&
            i + 1 !== main.length
        ) {
            result.push(toSpread[spreadIndex++]);
        }
    }

    while (spreadIndex < toSpread.length) {
        result.push(toSpread[spreadIndex++]);
    }

    return result;
};

type SocialPostDraft = Omit<ScheduledSocialPost, 'date'>;

const gridDates = (
    now: number,
    count: number,
    reserved: number[],
): number[] => {
    const dates: number[] = [];
    let cursor = now + SOCIAL_POST_SLOT_MS;
    while (dates.length < count) {
        const taken = reserved.some(
            (date) => Math.abs(date - cursor) < SOCIAL_POST_SLOT_MS / 2,
        );
        if (!taken) dates.push(cursor);
        cursor += SOCIAL_POST_SLOT_MS;
    }

    return dates;
};

export type BuildSocialScheduleParams = {
    latestJobPosts: JobPost[];
    weekJobPosts: JobPost[];
    companiesById: Map<string, Company>;
    /** Open roles used to fill company threads when today's posts are scarce. */
    openJobPosts?: JobPost[];
    now?: number;
    includeWeeklyTopPaid?: boolean;
};

export const buildSocialSchedule = ({
    latestJobPosts,
    weekJobPosts,
    companiesById,
    openJobPosts = latestJobPosts,
    now = Date.now(),
    includeWeeklyTopPaid = new Date(now).getUTCDay() === 1,
}: BuildSocialScheduleParams): ScheduledSocialPost[] => {
    const dateKey = toDateKey(now);
    const pinned: ScheduledSocialPost[] = [];

    const analysisLatest = latestJobPosts.filter(isEligibleForSocialAnalysis);
    if (analysisLatest.length > 0) {
        const date = nextZonedHour(
            now,
            DAILY_ANALYSIS_HOUR,
            SOCIAL_SCHEDULE_TIME_ZONE,
        );
        pinned.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.DailyAnalysis,
                dateKey: toDateKey(date),
            }),
            type: SocialPostType.DailyAnalysis,
            platforms: [...ALL_SOCIAL_PLATFORMS],
            date,
        });
    }

    const newRemoteWithSalary = latestJobPosts.filter(isEligibleForSocial);
    if (newRemoteWithSalary.length > NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS) {
        const date = nextZonedHour(
            now,
            NEWSLETTER_SUBSCRIBE_HOUR,
            SOCIAL_SCHEDULE_TIME_ZONE,
        );
        pinned.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.NewsletterSubscribe,
                dateKey: toDateKey(date),
            }),
            type: SocialPostType.NewsletterSubscribe,
            platforms: [...ALL_SOCIAL_PLATFORMS],
            date,
        });
    }

    const flowing: SocialPostDraft[] = [];
    if (
        includeWeeklyTopPaid &&
        weekJobPosts.some(isEligibleForSocialAnalysis)
    ) {
        const date = nextZonedHour(
            now,
            WEEKLY_TOP_PAID_HOUR,
            SOCIAL_SCHEDULE_TIME_ZONE,
        );
        pinned.push({
            id: makeScheduledSocialPostId({
                type: SocialPostType.WeeklyTopPaid,
                weekKey: toWeekKey(now),
            }),
            type: SocialPostType.WeeklyTopPaid,
            platforms: [...ALL_SOCIAL_PLATFORMS],
            date,
        });
    }

    const jobPromoCandidates = pickBestPaidJobPerCompany(latestJobPosts);
    const usedCompanyThreadIds = new Set<string>();
    const threadTarget = companyThreadCountForPromos(jobPromoCandidates.length);
    const fromLatest = pickCompaniesForThreads({
        jobPosts: latestJobPosts,
        companiesById,
        excludeCompanyIds: usedCompanyThreadIds,
        limit: threadTarget,
    });
    const fromOpen = pickCompaniesForThreads({
        jobPosts: openJobPosts,
        companiesById,
        excludeCompanyIds: usedCompanyThreadIds,
        limit: threadTarget - fromLatest.length,
    });
    const companiesForThreads = [...fromLatest, ...fromOpen];
    const companyThreadDrafts: SocialPostDraft[] = companiesForThreads.map(
        (companyForThread) => ({
            id: makeScheduledSocialPostId({
                type: SocialPostType.CompanyThread,
                companyId: companyForThread.id,
                dateKey,
            }),
            type: SocialPostType.CompanyThread,
            platforms: [...ALL_SOCIAL_PLATFORMS],
            companyId: companyForThread.id,
        }),
    );
    const flowingBudget = MAX_PUBLICATIONS_PER_DAY - pinned.length;
    const jobPromoDrafts: SocialPostDraft[] = [];
    for (const jobPost of jobPromoCandidates) {
        if (
            flowing.length +
                companyThreadDrafts.length +
                jobPromoDrafts.length >=
            flowingBudget
        )
            break;

        jobPromoDrafts.push({
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

    flowing.push(...interleaveEvenly(jobPromoDrafts, companyThreadDrafts));
    const dates = gridDates(
        now,
        flowing.length,
        pinned.map((post) => post.date),
    );
    const flowingPosts = flowing.map((draft, index) => ({
        ...draft,
        date: dates[index],
    }));

    return [...pinned, ...flowingPosts].sort((a, b) => a.date - b.date);
};
