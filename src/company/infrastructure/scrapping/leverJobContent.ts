import { Period } from 'jobPost/domain/jobPost';

export type LeverSalaryRange = {
    min?: number;
    max?: number;
    currency?: string;
    interval?: string;
};

export type LeverListSection = {
    text?: string;
    content?: string;
};

export type LeverJobPosting = {
    id: string;
    hostedUrl: string;
    text: string;
    createdAt: number;
    descriptionPlain: string;
    additionalPlain?: string;
    lists?: LeverListSection[];
    salaryRange?: LeverSalaryRange | null;
    workplaceType?: string;
    categories?: {
        commitment?: string;
        location?: string;
        team?: string;
        department?: string;
        allLocations?: string[];
    };
};

const stripHtml = (html: string) =>
    html
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const mapLeverIntervalToPeriod = (interval?: string): Period => {
    const value = (interval || '').toLowerCase();

    if (value.includes('month')) return Period.Month;
    if (value.includes('week')) return Period.Week;
    if (value.includes('day')) return Period.Day;
    if (value.includes('hour')) return Period.Hour;

    return Period.Year;
};

export const mapLeverSalaryRange = (salaryRange?: LeverSalaryRange | null) => {
    if (!salaryRange) return null;
    if (salaryRange.min == null && salaryRange.max == null) return null;

    return {
        min: salaryRange.min ?? null,
        max: salaryRange.max ?? null,
        currency: salaryRange.currency?.toLowerCase() ?? null,
        period: mapLeverIntervalToPeriod(salaryRange.interval),
    };
};

export const buildLeverJobContent = (jobData: LeverJobPosting) => {
    const parts: string[] = [jobData.descriptionPlain];
    const categories = jobData.categories;

    if (categories) {
        const meta = [
            categories.location && `Location: ${categories.location}`,
            categories.allLocations?.length &&
                `Locations: ${categories.allLocations.join(', ')}`,
            categories.team && `Team: ${categories.team}`,
            categories.department && `Department: ${categories.department}`,
            categories.commitment && `Commitment: ${categories.commitment}`,
            jobData.workplaceType && `Workplace: ${jobData.workplaceType}`,
        ].filter(Boolean);

        if (meta.length) {
            parts.push(meta.join('\n'));
        }
    } else if (jobData.workplaceType) {
        parts.push(`Workplace: ${jobData.workplaceType}`);
    }

    for (const list of jobData.lists || []) {
        const heading = list.text?.trim();
        const body = stripHtml(list.content || '');
        if (!heading && !body) continue;
        parts.push([heading, body].filter(Boolean).join('\n'));
    }

    if (jobData.additionalPlain) {
        parts.push(jobData.additionalPlain);
    }

    if (jobData.salaryRange) {
        const { min, max, currency, interval } = jobData.salaryRange;
        parts.push(
            `Salary range: ${min ?? ''} - ${max ?? ''} ${currency ?? ''} (${interval ?? 'per-year-salary'})`.trim(),
        );
    }

    return parts.filter(Boolean).join('\n\n');
};
