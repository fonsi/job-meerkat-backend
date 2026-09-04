import {
    Category,
    JobType,
    Workplace,
    hasAnalyzedJobPostFields,
} from 'jobPost/domain/jobPost';

describe('hasAnalyzedJobPostFields', () => {
    const complete = {
        title: 'Backend Engineer',
        category: Category.Backend,
        type: JobType.FullTime,
        workplace: Workplace.Remote,
        location: 'worldwide',
    };

    it('accepts a fully analyzed job post', () => {
        expect(hasAnalyzedJobPostFields(complete)).toBe(true);
    });

    it('rejects a failed scrape with only listing metadata', () => {
        expect(
            hasAnalyzedJobPostFields({
                title: undefined,
                category: undefined,
                type: undefined,
                workplace: undefined,
                location: undefined,
            }),
        ).toBe(false);
    });

    it('rejects a title-only fallback', () => {
        expect(
            hasAnalyzedJobPostFields({
                ...complete,
                title: 'Backend Engineer',
                category: undefined,
            }),
        ).toBe(false);
    });
});
