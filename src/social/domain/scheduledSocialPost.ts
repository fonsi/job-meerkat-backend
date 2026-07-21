import { CompanyId } from 'company/domain/company';
import { JobPostId } from 'jobPost/domain/jobPost';
import { SocialPlatform } from './socialPlatform';
import { SocialPostType } from './socialPostType';

export type ScheduledSocialPostId = string;

export type ScheduledSocialPost = {
    id: ScheduledSocialPostId;
    date: number;
    type: SocialPostType;
    platforms: SocialPlatform[];
    jobPostId?: JobPostId;
    companyId?: CompanyId;
};

type JobPromoIdData = {
    type: SocialPostType.JobPromo;
    jobPostId: JobPostId;
    companyId: CompanyId;
};

type DailyAnalysisIdData = {
    type: SocialPostType.DailyAnalysis;
    dateKey: string;
};

type WeeklyTopPaidIdData = {
    type: SocialPostType.WeeklyTopPaid;
    weekKey: string;
};

type CompanyThreadIdData = {
    type: SocialPostType.CompanyThread;
    companyId: CompanyId;
    dateKey: string;
};

export type MakeScheduledSocialPostIdData =
    | JobPromoIdData
    | DailyAnalysisIdData
    | WeeklyTopPaidIdData
    | CompanyThreadIdData;

export const makeScheduledSocialPostId = (
    data: MakeScheduledSocialPostIdData,
): ScheduledSocialPostId => {
    switch (data.type) {
        case SocialPostType.JobPromo:
            return `${SocialPostType.JobPromo}_${data.jobPostId}_${data.companyId}`;
        case SocialPostType.DailyAnalysis:
            return `${SocialPostType.DailyAnalysis}_${data.dateKey}`;
        case SocialPostType.WeeklyTopPaid:
            return `${SocialPostType.WeeklyTopPaid}_${data.weekKey}`;
        case SocialPostType.CompanyThread:
            return `${SocialPostType.CompanyThread}_${data.companyId}_${data.dateKey}`;
    }
};

/** UTC YYYY-MM-DD */
export const toDateKey = (timestamp: number): string =>
    new Date(timestamp).toISOString().slice(0, 10);

/** UTC ISO week key, e.g. 2026-W30 */
export const toWeekKey = (timestamp: number): string => {
    const date = new Date(timestamp);
    const utc = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
    const dayNum = utc.getUTCDay() || 7;
    utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(
        ((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );

    return `${utc.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};
