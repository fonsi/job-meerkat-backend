import { CompanyId } from 'company/domain/company';
import { JobPostId } from 'jobPost/domain/jobPost';

type ScheduledSocialPostIdData = {
    jobPostId: JobPostId;
    companyId: CompanyId;
};

export type ScheduledSocialPostId = string;

export type ScheduledSocialPost = {
    id: ScheduledSocialPostId;
    date: number;
};

export const makeScheduledSocialPostId = ({
    jobPostId,
    companyId,
}: ScheduledSocialPostIdData): ScheduledSocialPostId =>
    `${jobPostId}_${companyId}`;

export const splitScheduledSocialPostId = (
    scheduledSocialPostId: ScheduledSocialPostId,
): ScheduledSocialPostIdData => {
    const [jobPostId, companyId] = scheduledSocialPostId.split('_');

    return {
        jobPostId,
        companyId,
    } as ScheduledSocialPostIdData;
};
