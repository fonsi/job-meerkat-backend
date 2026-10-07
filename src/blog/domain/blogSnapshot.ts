import { Category } from 'jobPost/domain/jobPost';
import { BlogListing, BlogPostKind } from './blogPost';

export type BlogCount = { value: string; count: number };

export type BlogMarketSnapshot = {
    kind: BlogPostKind;
    slug: string;
    /** End of the completed reporting period (ISO). */
    asOf: string;
    /** Human period label the copy must use, e.g. "September 2026". */
    periodLabel: string;
    periodStart: string;
    periodEnd: string;
    windowDays: number;
    jobCount: number;
    /** Jobs created inside the reporting period (same as jobCount). */
    newJobCount: number;
    companyCount: number;
    medianSalaryLabel: string | null;
    maxSalaryLabel: string | null;
    topCategories: BlogCount[];
    workplaces: BlogCount[];
    listings: BlogListing[];
    category?: { name: Category; slug: string };
};

export const MIN_MONTHLY_SAMPLE = 8;
export const MIN_CATEGORY_SAMPLE = 5;
export const MAX_BLOG_LISTINGS = 10;
