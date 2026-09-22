import { Company, isCompanyDisabled } from 'company/domain/company';
import { JobPost, JobPostDetails } from 'jobPost/domain/jobPost';
import {
    FollowerGrowthDataRequest,
    FollowerGrowthDetailField,
    FollowerGrowthPlan,
} from 'social/domain/followerGrowthPlan';
import {
    annualSalaryMax,
    formatSalaryLabel,
    isEligibleForSocialAnalysis,
    median,
} from './socialJobStats';

const MAX_GROUPS = 20;
const MAX_PATTERN_VALUES = 12;
const MAX_TOTAL_DETAIL_JOBS = 20;

export type FollowerGrowthEvidence = {
    id: string;
    statement: string;
};

export type FollowerGrowthInventory = {
    generatedAt: string;
    scope: string;
    jobCount: number;
    companyCount: number;
    categories: Array<{ value: string; count: number }>;
    currencies: Array<{ value: string; count: number }>;
    jobTypes: Array<{ value: string; count: number }>;
    locations: Array<{ value: string; count: number }>;
};

export type FollowerGrowthDataAvailability = {
    requestIndex: number;
    kind: FollowerGrowthDataRequest['kind'];
    status: 'available' | 'unavailable';
    message: string;
};

export type FollowerGrowthDataset = {
    generatedAt: string;
    scope: string;
    angle: string;
    availability: FollowerGrowthDataAvailability[];
    evidence: FollowerGrowthEvidence[];
};

type ResolveFollowerGrowthDataInput = {
    plan: FollowerGrowthPlan;
    jobPosts: JobPost[];
    companies: Company[];
    detailsByJobPostId?: Map<JobPost['id'], JobPostDetails>;
    now?: number;
};

const countBy = <T>(
    values: T[],
    getKey: (value: T) => string,
    limit = MAX_GROUPS,
): Array<{ value: string; count: number }> => {
    const counts = new Map<string, number>();
    for (const value of values) {
        const key = getKey(value);
        counts.set(key, (counts.get(key) ?? 0) + 1);
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

const filterJobs = (
    jobs: JobPost[],
    request: FollowerGrowthDataRequest,
): JobPost[] => {
    const filters = request as {
        category?: string;
        currency?: string;
    };

    return jobs.filter(
        (job) =>
            (!filters.category || job.category === filters.category) &&
            (!filters.currency ||
                job.salaryRange?.currency.toUpperCase() === filters.currency),
    );
};

const sortBySalary = (jobs: JobPost[]): JobPost[] =>
    [...jobs].sort(
        (a, b) =>
            annualSalaryMax(b) - annualSalaryMax(a) ||
            b.createdAt - a.createdAt,
    );

export const buildFollowerGrowthInventory = ({
    jobPosts,
    companies,
    now = Date.now(),
}: {
    jobPosts: JobPost[];
    companies: Company[];
    now?: number;
}): FollowerGrowthInventory => {
    const { jobs } = eligibleJobs(jobPosts, companies);
    if (jobs.length === 0) {
        throw new Error(
            'No open remote jobs with public USD/EUR salaries are available',
        );
    }

    return {
        generatedAt: new Date(now).toISOString(),
        scope: 'Currently open remote Jobmeerkat listings with public USD or EUR salaries; no historical trend data is available.',
        jobCount: jobs.length,
        companyCount: new Set(jobs.map((job) => job.companyId)).size,
        categories: countBy(jobs, (job) => job.category),
        currencies: countBy(
            jobs,
            (job) => job.salaryRange?.currency.toUpperCase() ?? 'Unknown',
        ),
        jobTypes: countBy(jobs, (job) => job.type),
        locations: countBy(
            jobs,
            (job) => job.location.trim() || 'Not specified',
        ),
    };
};

export const selectFollowerGrowthPlanDetailJobs = ({
    plan,
    jobPosts,
    companies,
}: {
    plan: FollowerGrowthPlan;
    jobPosts: JobPost[];
    companies: Company[];
}): JobPost[] => {
    const { jobs } = eligibleJobs(jobPosts, companies);
    const selected = new Map<JobPost['id'], JobPost>();

    for (const request of plan.dataRequests) {
        if (
            request.kind !== 'listingDetails' &&
            request.kind !== 'detailPatterns'
        ) {
            continue;
        }
        const candidates = sortBySalary(filterJobs(jobs, request)).slice(
            0,
            MAX_TOTAL_DETAIL_JOBS,
        );
        for (const job of candidates) {
            if (selected.size >= MAX_TOTAL_DETAIL_JOBS) break;
            selected.set(job.id, job);
        }
    }

    return [...selected.values()];
};

const salaryDistributionEvidence = (
    jobs: JobPost[],
    request: Extract<FollowerGrowthDataRequest, { kind: 'salaryDistribution' }>,
): string | null => {
    const filtered = filterJobs(jobs, request);
    const currencies = request.currency ? [request.currency] : ['USD', 'EUR'];
    const distributions = currencies
        .map((currency) => {
            const values = filtered
                .filter(
                    (job) =>
                        job.salaryRange?.currency.toUpperCase() === currency,
                )
                .map(annualSalaryMax);
            if (values.length < 2) return null;
            const medianAnnualMaximum = median(values);
            if (medianAnnualMaximum == null) return null;

            return {
                currency,
                count: values.length,
                medianAnnualMaximum: Math.round(medianAnnualMaximum),
                highestAnnualMaximum: Math.round(Math.max(...values)),
            };
        })
        .filter((value) => value != null);

    return distributions.length > 0
        ? `Annualized salary maximum distribution${request.category ? ` for ${request.category}` : ''}: ${JSON.stringify(distributions)}.`
        : null;
};

const distributionEvidence = (
    jobs: JobPost[],
    request: Extract<
        FollowerGrowthDataRequest,
        {
            kind:
                | 'categoryDistribution'
                | 'locationDistribution'
                | 'jobTypeDistribution';
        }
    >,
): string | null => {
    const filtered = filterJobs(jobs, request);
    if (filtered.length === 0) return null;

    const values =
        request.kind === 'categoryDistribution'
            ? countBy(filtered, (job) => job.category)
            : request.kind === 'locationDistribution'
              ? countBy(
                    filtered,
                    (job) => job.location.trim() || 'Not specified',
                )
              : countBy(filtered, (job) => job.type);

    return `${request.kind}${'category' in request && request.category ? ` for ${request.category}` : ''}: ${JSON.stringify(values)}.`;
};

const topListingsEvidence = (
    jobs: JobPost[],
    companiesById: Map<Company['id'], Company>,
    request: Extract<FollowerGrowthDataRequest, { kind: 'topListings' }>,
): string | null => {
    const listings = sortBySalary(filterJobs(jobs, request))
        .slice(0, request.limit)
        .map((job) => ({
            title: job.title,
            company: companiesById.get(job.companyId)?.name,
            category: job.category,
            jobType: job.type,
            location: job.location,
            salary: formatSalaryLabel(job),
        }));

    return listings.length > 0
        ? `Highest annualized salary listings matching the request: ${JSON.stringify(listings)}.`
        : null;
};

const selectedDetails = (
    details: JobPostDetails,
    fields: FollowerGrowthDetailField[],
): Partial<JobPostDetails> =>
    Object.fromEntries(
        fields
            .filter((field) => details[field] != null)
            .map((field) => [field, details[field]]),
    );

const detailEvidence = (
    jobs: JobPost[],
    companiesById: Map<Company['id'], Company>,
    detailsByJobPostId: Map<JobPost['id'], JobPostDetails>,
    request: Extract<
        FollowerGrowthDataRequest,
        { kind: 'listingDetails' | 'detailPatterns' }
    >,
): string | null => {
    const samples = sortBySalary(filterJobs(jobs, request))
        .slice(0, MAX_TOTAL_DETAIL_JOBS)
        .map((job) => {
            const details = detailsByJobPostId.get(job.id);
            if (!details) return null;
            const selected = selectedDetails(details, request.fields);
            if (Object.keys(selected).length === 0) return null;

            return {
                title: job.title,
                company: companiesById.get(job.companyId)?.name,
                category: job.category,
                salary: formatSalaryLabel(job),
                details: selected,
            };
        })
        .filter((sample) => sample != null)
        .slice(0, request.sampleSize);
    if (samples.length === 0) return null;
    if (request.kind === 'listingDetails') {
        return `Listing detail examples from ${samples.length} matching jobs: ${JSON.stringify(samples)}.`;
    }
    if (samples.length < 2) return null;

    const patterns = new Map<string, { value: string; count: number }>();
    for (const sample of samples) {
        for (const field of request.fields) {
            const rawValue = sample.details[field];
            const values = Array.isArray(rawValue)
                ? rawValue
                : typeof rawValue === 'string'
                  ? [rawValue]
                  : [];
            for (const value of values) {
                const key = `${field}:${value.trim().toLowerCase()}`;
                const current = patterns.get(key);
                patterns.set(key, {
                    value: `${field}: ${value.trim()}`,
                    count: (current?.count ?? 0) + 1,
                });
            }
        }
    }
    const rankedPatterns = [...patterns.values()]
        .filter(({ count }) => count > 1)
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
        .slice(0, MAX_PATTERN_VALUES);

    return rankedPatterns.length > 0
        ? `Exact detail values observed across ${samples.length} matching listings: ${JSON.stringify(rankedPatterns)}. Counts only indicate exact repeated text, not semantic equivalence.`
        : null;
};

const compareGroupsEvidence = (
    jobs: JobPost[],
    request: Extract<FollowerGrowthDataRequest, { kind: 'compareGroups' }>,
): string | null => {
    const valueFor = (job: JobPost): string => {
        switch (request.dimension) {
            case 'category':
                return job.category;
            case 'jobType':
                return job.type;
            case 'location':
                return job.location.trim() || 'Not specified';
        }
    };
    const currencyJobs = request.currency
        ? jobs.filter(
              (job) =>
                  job.salaryRange?.currency.toUpperCase() === request.currency,
          )
        : jobs;
    const comparison = request.groups.map((group) => {
        const groupJobs = currencyJobs.filter((job) => valueFor(job) === group);
        if (groupJobs.length === 0) return null;
        if (request.metric === 'count') {
            return { group, count: groupJobs.length };
        }
        if (groupJobs.length < 2) return null;
        const salaries = groupJobs.map(annualSalaryMax);

        return {
            group,
            currency: request.currency,
            count: salaries.length,
            medianAnnualMaximum: Math.round(median(salaries) ?? 0),
            highestAnnualMaximum: Math.round(Math.max(...salaries)),
        };
    });
    if (comparison.some((result) => result == null)) return null;

    return `${request.metric} comparison by ${request.dimension}: ${JSON.stringify(comparison)}.`;
};

const resolveRequest = ({
    request,
    jobs,
    companiesById,
    detailsByJobPostId,
}: {
    request: FollowerGrowthDataRequest;
    jobs: JobPost[];
    companiesById: Map<Company['id'], Company>;
    detailsByJobPostId: Map<JobPost['id'], JobPostDetails>;
}): string | null => {
    switch (request.kind) {
        case 'salaryDistribution':
            return salaryDistributionEvidence(jobs, request);
        case 'categoryDistribution':
        case 'locationDistribution':
        case 'jobTypeDistribution':
            return distributionEvidence(jobs, request);
        case 'topListings':
            return topListingsEvidence(jobs, companiesById, request);
        case 'listingDetails':
        case 'detailPatterns':
            return detailEvidence(
                jobs,
                companiesById,
                detailsByJobPostId,
                request,
            );
        case 'compareGroups':
            return compareGroupsEvidence(jobs, request);
    }
};

export const resolveFollowerGrowthData = ({
    plan,
    jobPosts,
    companies,
    detailsByJobPostId = new Map(),
    now = Date.now(),
}: ResolveFollowerGrowthDataInput): FollowerGrowthDataset => {
    const { jobs, companiesById } = eligibleJobs(jobPosts, companies);
    const evidence: FollowerGrowthEvidence[] = [];
    const availability = plan.dataRequests.map((request, index) => {
        const statement = resolveRequest({
            request,
            jobs,
            companiesById,
            detailsByJobPostId,
        });
        if (!statement) {
            return {
                requestIndex: index,
                kind: request.kind,
                status: 'unavailable' as const,
                message: `No sufficient data was available for ${request.kind}: ${JSON.stringify(request)}.`,
            };
        }

        evidence.push({ id: `request-${index + 1}`, statement });

        return {
            requestIndex: index,
            kind: request.kind,
            status: 'available' as const,
            message: `Resolved ${request.kind}.`,
        };
    });

    return {
        generatedAt: new Date(now).toISOString(),
        scope: 'Evidence retrieved from currently open remote Jobmeerkat listings with public USD or EUR salaries; this is not longitudinal data.',
        angle: plan.angle,
        availability,
        evidence,
    };
};

export const followerGrowthDataIsComplete = (
    dataset: FollowerGrowthDataset,
): boolean =>
    dataset.availability.length > 0 &&
    dataset.availability.every(({ status }) => status === 'available') &&
    dataset.evidence.length > 0;
