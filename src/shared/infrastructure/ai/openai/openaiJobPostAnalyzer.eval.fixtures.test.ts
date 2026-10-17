import { Category, JobType, Period, Workplace } from 'jobPost/domain/jobPost';
import {
    openaiJobPostAnalyzerEvalFixtures,
    scoreAnalyzerResult,
} from './openaiJobPostAnalyzer.eval.fixtures';

describe('openaiJobPostAnalyzer eval fixtures', () => {
    it('defines representative fixtures with gold expectations', () => {
        expect(openaiJobPostAnalyzerEvalFixtures.length).toBeGreaterThanOrEqual(
            6,
        );
        for (const fixture of openaiJobPostAnalyzerEvalFixtures) {
            expect(fixture.id).toBeTruthy();
            expect(fixture.content.trim().length).toBeGreaterThan(40);
            expect(fixture.gold.category).toBeTruthy();
            expect(fixture.gold.location).toBeTruthy();
        }
    });

    it('scores a perfect analyzer result at full marks', () => {
        const fixture = openaiJobPostAnalyzerEvalFixtures.find(
            (item) => item.id === 'clear-backend-with-salary',
        );
        if (!fixture) throw new Error('missing fixture');

        const scored = scoreAnalyzerResult(fixture, {
            title: 'Senior Backend Engineer',
            category: Category.Backend,
            type: JobType.FullTime,
            workplace: Workplace.Remote,
            location: 'worldwide',
            salaryRange: {
                min: 140000,
                max: 180000,
                currency: 'usd',
                period: Period.Year,
            },
            details: {
                summary: 'Build payment APIs.',
                team: 'Payments Platform squad',
                stack: ['Go', 'PostgreSQL', 'Kafka', 'AWS'],
            },
        });

        expect(scored.parsed).toBe(true);
        expect(scored.failures).toEqual([]);
        expect(scored.score).toBe(scored.maxScore);
    });

    it('penalizes wrong category and parse failures', () => {
        const fixture = openaiJobPostAnalyzerEvalFixtures[0];
        const wrong = scoreAnalyzerResult(fixture, {
            title: 'x',
            category: Category.Other,
            type: JobType.FullTime,
            workplace: Workplace.Remote,
            location: 'worldwide',
            salaryRange: {
                min: 140000,
                max: 180000,
                currency: 'usd',
                period: Period.Year,
            },
            details: {
                stack: ['Go', 'PostgreSQL', 'Kafka'],
                team: 'Payments Platform',
            },
        });
        expect(wrong.failures.some((item) => item.field === 'category')).toBe(
            true,
        );

        const failed = scoreAnalyzerResult(fixture, null, 'boom');
        expect(failed.parsed).toBe(false);
        expect(failed.score).toBeLessThan(failed.maxScore);
    });
});
