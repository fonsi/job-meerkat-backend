import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';

export const DEFAULT_MAX_JOB_POSTS_PER_COMPANY = 4;
export const COMPACT_MAX_JOB_POSTS_PER_COMPANY = 2;
export const COMPACT_TOTAL_JOB_POSTS_THRESHOLD = 60;
export const MAX_VISIBLE_JOB_POSTS = 48;

type CompanyJobs = {
    company: Company;
    jobPosts: JobPost[];
};

export type VisibleCompanyJobs = CompanyJobs & {
    visibleJobPosts: JobPost[];
};

export const maxJobPostsPerCompany = (totalJobPosts: number): number =>
    totalJobPosts > COMPACT_TOTAL_JOB_POSTS_THRESHOLD
        ? COMPACT_MAX_JOB_POSTS_PER_COMPANY
        : DEFAULT_MAX_JOB_POSTS_PER_COMPANY;

export const selectVisibleJobPostsForReport = (
    companies: CompanyJobs[],
    totalJobPosts: number,
): {
    companies: VisibleCompanyJobs[];
    hiddenCompanyCount: number;
    remainingJobPostCount: number;
} => {
    const maxPerCompany = maxJobPostsPerCompany(totalJobPosts);
    const visibleCounts = new Array(companies.length).fill(0);
    let remainingBudget = MAX_VISIBLE_JOB_POSTS;

    for (let round = 0; round < maxPerCompany && remainingBudget > 0; round++) {
        for (let i = 0; i < companies.length && remainingBudget > 0; i++) {
            if (round < companies[i].jobPosts.length) {
                visibleCounts[i]++;
                remainingBudget--;
            }
        }
    }

    const visibleCompanies = companies
        .map((entry, i) => ({
            company: entry.company,
            jobPosts: entry.jobPosts,
            visibleJobPosts: entry.jobPosts.slice(0, visibleCounts[i]),
        }))
        .filter((entry) => entry.visibleJobPosts.length > 0);

    const visibleJobPostCount = visibleCompanies.reduce(
        (total, entry) => total + entry.visibleJobPosts.length,
        0,
    );

    return {
        companies: visibleCompanies,
        hiddenCompanyCount: companies.length - visibleCompanies.length,
        remainingJobPostCount: totalJobPosts - visibleJobPostCount,
    };
};
