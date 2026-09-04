import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';

export const DEFAULT_MAX_JOB_POSTS_PER_COMPANY = 4;
export const COMPACT_MAX_JOB_POSTS_PER_COMPANY = 2;
export const SINGLE_MAX_JOB_POSTS_PER_COMPANY = 1;
export const COMPACT_TOTAL_JOB_POSTS_THRESHOLD = 60;
export const SINGLE_COMPANY_COUNT_THRESHOLD = 25;

type CompanyJobs = {
    company: Company;
    jobPosts: JobPost[];
};

export type VisibleCompanyJobs = CompanyJobs & {
    visibleJobPosts: JobPost[];
};

export const maxJobPostsPerCompany = (
    totalJobPosts: number,
    companyCount: number,
): number => {
    if (
        totalJobPosts > COMPACT_TOTAL_JOB_POSTS_THRESHOLD &&
        companyCount > SINGLE_COMPANY_COUNT_THRESHOLD
    ) {
        return SINGLE_MAX_JOB_POSTS_PER_COMPANY;
    }

    if (totalJobPosts > COMPACT_TOTAL_JOB_POSTS_THRESHOLD) {
        return COMPACT_MAX_JOB_POSTS_PER_COMPANY;
    }

    return DEFAULT_MAX_JOB_POSTS_PER_COMPANY;
};

export const selectVisibleJobPostsForReport = (
    companies: CompanyJobs[],
    totalJobPosts: number,
): { companies: VisibleCompanyJobs[] } => {
    const maxPerCompany = maxJobPostsPerCompany(
        totalJobPosts,
        companies.length,
    );

    return {
        companies: companies.map((entry) => ({
            company: entry.company,
            jobPosts: entry.jobPosts,
            visibleJobPosts: entry.jobPosts.slice(0, maxPerCompany),
        })),
    };
};
