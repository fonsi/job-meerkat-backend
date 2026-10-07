import { Company, isCompanyDisabled } from 'company/domain/company';
import { Category, JobPost } from 'jobPost/domain/jobPost';
import {
    annualSalaryMax,
    formatSalaryLabel,
    isEligibleForSocialAnalysis,
    median,
} from 'social/application/socialJobStats';
import {
    BlogMarketSnapshot,
    MAX_BLOG_LISTINGS,
    MIN_CATEGORY_SAMPLE,
    MIN_MONTHLY_SAMPLE,
} from 'blog/domain/blogSnapshot';
import { BlogPostType } from 'blog/domain/blogPost';
import {
    BlogPeriod,
    isCreatedInPeriod,
    previousUtcMonth,
    previousUtcWeek,
} from 'blog/domain/blogPeriods';
import { blogCategorySlug } from 'blog/domain/selectNextCategory';
import {
    buildJobPostPageUrl,
    UtmSource,
    withBlogUtm,
} from 'shared/infrastructure/url/buildJobPostPageUrl';

const countBy = (
    values: string[],
    limit = 8,
): Array<{ value: string; count: number }> => {
    const counts = new Map<string, number>();
    for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }

    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, limit)
        .map(([value, count]) => ({ value, count }));
};

const eligibleJobs = (
    jobPosts: JobPost[],
    companies: Company[],
): {
    jobs: JobPost[];
    companiesById: Map<Company['id'], Company>;
} => {
    const companiesById = new Map(
        companies
            .filter((company) => !isCompanyDisabled(company))
            .map((company) => [company.id, company]),
    );
    const jobs = jobPosts.filter(
        (jobPost) =>
            isEligibleForSocialAnalysis(jobPost) &&
            companiesById.has(jobPost.companyId),
    );

    return { jobs, companiesById };
};

const salaryLabels = (jobs: JobPost[]) => {
    const withSalary = [...jobs]
        .filter((job) => annualSalaryMax(job) > 0)
        .sort((a, b) => annualSalaryMax(a) - annualSalaryMax(b));
    const mid = median(withSalary.map(annualSalaryMax));
    const medianJob =
        mid == null
            ? null
            : withSalary.reduce((closest, job) =>
                  Math.abs(annualSalaryMax(job) - mid) <
                  Math.abs(annualSalaryMax(closest) - mid)
                      ? job
                      : closest,
              );
    const top = withSalary[withSalary.length - 1];

    return {
        medianSalaryLabel: medianJob ? formatSalaryLabel(medianJob) : null,
        maxSalaryLabel: top ? formatSalaryLabel(top) : null,
    };
};

const toListings = (
    jobs: JobPost[],
    companiesById: Map<Company['id'], Company>,
    campaign: string,
) =>
    [...jobs]
        .sort(
            (a, b) =>
                annualSalaryMax(b) - annualSalaryMax(a) ||
                b.createdAt - a.createdAt,
        )
        .slice(0, MAX_BLOG_LISTINGS)
        .map((job) => ({
            title: job.title,
            companyName: companiesById.get(job.companyId)?.name ?? 'Unknown',
            salaryLabel: formatSalaryLabel(job),
            category: job.category,
            jobUrl: withBlogUtm(
                buildJobPostPageUrl(job.slug, UtmSource.Blog),
                campaign,
            ),
        }));

const periodDate = (ms: number): string =>
    new Date(ms).toISOString().slice(0, 10);

const snapshotFromJobs = ({
    jobs,
    companiesById,
    slug,
    kind,
    period,
    category,
}: {
    jobs: JobPost[];
    companiesById: Map<Company['id'], Company>;
    slug: string;
    kind: BlogMarketSnapshot['kind'];
    period: BlogPeriod;
    category?: Category;
}): BlogMarketSnapshot => {
    const salaries = salaryLabels(jobs);

    return {
        kind,
        slug,
        asOf: new Date(period.endMs - 1).toISOString(),
        periodLabel: period.label,
        periodStart: periodDate(period.startMs),
        periodEnd: periodDate(period.endMs - 1),
        windowDays: period.dayCount,
        jobCount: jobs.length,
        newJobCount: jobs.length,
        companyCount: new Set(jobs.map((job) => job.companyId)).size,
        medianSalaryLabel: salaries.medianSalaryLabel,
        maxSalaryLabel: salaries.maxSalaryLabel,
        topCategories: countBy(jobs.map((job) => job.category)),
        workplaces: countBy(jobs.map((job) => job.workplace)),
        listings: toListings(jobs, companiesById, slug),
        ...(category
            ? { category: { name: category, slug: blogCategorySlug(category) } }
            : {}),
    };
};

export const buildMonthlyRecapSnapshot = ({
    jobPosts,
    companies,
    slug,
    now = Date.now(),
}: {
    jobPosts: JobPost[];
    companies: Company[];
    slug: string;
    now?: number;
}): BlogMarketSnapshot | null => {
    const { jobs, companiesById } = eligibleJobs(jobPosts, companies);
    const period = previousUtcMonth(now);
    const inPeriod = jobs.filter((job) =>
        isCreatedInPeriod(job.createdAt, period),
    );
    if (inPeriod.length < MIN_MONTHLY_SAMPLE) return null;

    return snapshotFromJobs({
        jobs: inPeriod,
        companiesById,
        slug,
        kind: BlogPostType.MonthlyRecap,
        period,
    });
};

export const buildCategoryAnalysisSnapshot = ({
    jobPosts,
    companies,
    slug,
    category,
    now = Date.now(),
}: {
    jobPosts: JobPost[];
    companies: Company[];
    slug: string;
    category: Category;
    now?: number;
}): BlogMarketSnapshot | null => {
    const { jobs, companiesById } = eligibleJobs(jobPosts, companies);
    const period = previousUtcWeek(now);
    const inPeriod = jobs.filter(
        (job) =>
            job.category === category &&
            isCreatedInPeriod(job.createdAt, period),
    );
    if (inPeriod.length < MIN_CATEGORY_SAMPLE) return null;

    return snapshotFromJobs({
        jobs: inPeriod,
        companiesById,
        slug,
        kind: BlogPostType.CategoryAnalysis,
        period,
        category,
    });
};
