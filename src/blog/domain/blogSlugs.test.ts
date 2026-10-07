import { Category } from 'jobPost/domain/jobPost';
import { categoryAnalysisSlug, monthlyRecapSlug } from './blogSlugs';

describe('blogSlugs', () => {
    it('names the monthly slug after the previous month', () => {
        expect(monthlyRecapSlug(Date.UTC(2026, 9, 7))).toBe(
            'remote-job-market-2026-09',
        );
        expect(monthlyRecapSlug(Date.UTC(2026, 9, 1, 8))).toBe(
            'remote-job-market-2026-09',
        );
    });

    it('names the category slug after the previous week-ending Sunday', () => {
        expect(
            categoryAnalysisSlug(Category.Backend, Date.UTC(2026, 9, 7)),
        ).toBe('backend-jobs-2026-10-04');
        expect(
            categoryAnalysisSlug(Category.Backend, Date.UTC(2026, 9, 5, 8)),
        ).toBe('backend-jobs-2026-10-04');
    });
});
