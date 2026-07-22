import { JobPost, Period, Workplace } from 'jobPost/domain/jobPost';
import { buildJobPostPageUrl } from 'shared/infrastructure/url/buildJobPostPageUrl';
import { DailyAnalysisJobSummary } from 'shared/infrastructure/ai/openai/openaiCreateDailyAnalysisPosts';

const SOCIAL_CURRENCIES = new Set(['usd', 'eur']);

export const hasPublicSalary = (jobPost: JobPost): boolean =>
    !!jobPost.salaryRange?.max;

export const isRemoteJob = (jobPost: JobPost): boolean =>
    jobPost.workplace === Workplace.Remote;

export const isUsdOrEurSalary = (jobPost: JobPost): boolean => {
    const currency = jobPost.salaryRange?.currency?.toLowerCase();
    return currency != null && SOCIAL_CURRENCIES.has(currency);
};

/** All social publications: remote + public salary. */
export const isEligibleForSocial = (jobPost: JobPost): boolean =>
    isRemoteJob(jobPost) && hasPublicSalary(jobPost);

/** dailyAnalysis / weeklyTopPaid / companyThread: also USD or EUR only. */
export const isEligibleForSocialAnalysis = (jobPost: JobPost): boolean =>
    isEligibleForSocial(jobPost) && isUsdOrEurSalary(jobPost);

const toAnnual = (amount: number, period: Period): number => {
    switch (period) {
        case Period.Month:
            return amount * 12;
        case Period.Week:
            return amount * 52;
        case Period.Day:
            return amount * 260;
        case Period.Hour:
            return amount * 2080;
        default:
            return amount;
    }
};

export const formatSalaryLabel = (jobPost: JobPost): string => {
    const range = jobPost.salaryRange;
    if (!range?.max) {
        return 'salary n/a';
    }

    const currency = range.currency.toUpperCase();
    const max = Math.round(toAnnual(range.max, range.period));
    if (range.min == null) {
        return `up to ${max.toLocaleString('en-US')} ${currency}/yr`;
    }

    const min = Math.round(toAnnual(range.min, range.period));
    return `${min.toLocaleString('en-US')}–${max.toLocaleString('en-US')} ${currency}/yr`;
};

export const annualSalaryMax = (jobPost: JobPost): number => {
    const range = jobPost.salaryRange;
    if (!range?.max) {
        return 0;
    }
    return toAnnual(range.max, range.period);
};

export const toJobSummary = (
    jobPost: JobPost,
    companyName: string,
): DailyAnalysisJobSummary => ({
    title: jobPost.title,
    companyName,
    salaryLabel: formatSalaryLabel(jobPost),
    category: jobPost.category,
    jobUrl: buildJobPostPageUrl(jobPost.slug),
});

export const median = (values: number[]): number | null => {
    if (values.length === 0) {
        return null;
    }
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
};
