import { Category } from 'jobPost/domain/jobPost';
import { previousUtcMonth, previousUtcWeek } from './blogPeriods';
import { blogCategorySlug } from './selectNextCategory';

export const monthlyRecapSlug = (now: number): string =>
    `remote-job-market-${previousUtcMonth(now).slugStamp}`;

export const categoryAnalysisSlug = (category: Category, now: number): string =>
    `${blogCategorySlug(category)}-jobs-${previousUtcWeek(now).slugStamp}`;
