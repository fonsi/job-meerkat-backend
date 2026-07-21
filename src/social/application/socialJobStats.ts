import { JobPost, Period } from 'jobPost/domain/jobPost';
import { buildJobPostPageUrl } from 'shared/infrastructure/url/buildJobPostPageUrl';
import { DailyAnalysisJobSummary } from 'shared/infrastructure/ai/openai/openaiCreateDailyAnalysisPosts';

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
