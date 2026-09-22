import { Period } from './jobPost';
import {
    formatSalaryHighlight,
    formatSalaryRangeLabel,
} from './formatSalaryRange';

describe('formatSalaryRangeLabel', () => {
    it('formats a range in compact thousands', () => {
        expect(
            formatSalaryRangeLabel({
                min: 100000,
                max: 150000,
                currency: 'usd',
                period: Period.Year,
            }),
        ).toBe('100K - 150K USD / year');
    });

    it('formats an upper bound only', () => {
        expect(
            formatSalaryRangeLabel({
                max: 90000,
                currency: 'eur',
                period: Period.Year,
            }),
        ).toBe('Up to 90K EUR / year');
    });

    it('formats a lower bound only', () => {
        expect(
            formatSalaryRangeLabel({
                min: 80000,
                currency: 'usd',
                period: Period.Year,
            }),
        ).toBe('From 80K USD / year');
    });

    it('keeps amounts under 1000 unabbreviated', () => {
        expect(
            formatSalaryRangeLabel({
                min: 20,
                max: 40,
                currency: 'usd',
                period: Period.Hour,
            }),
        ).toBe('20 - 40 USD / hour');
    });

    it('splits a range into a highlight amount and caption', () => {
        expect(
            formatSalaryHighlight({
                min: 215000,
                max: 250000,
                currency: 'usd',
                period: Period.Year,
            }),
        ).toEqual({ amount: '215K–250K', caption: 'USD / year' });
    });

    it('returns null when there is no salary', () => {
        expect(formatSalaryRangeLabel(null)).toBeNull();
        expect(
            formatSalaryRangeLabel({
                currency: 'usd',
                period: Period.Year,
            }),
        ).toBeNull();
    });
});
