import {
    isCreatedInPeriod,
    previousUtcMonth,
    previousUtcWeek,
} from './blogPeriods';

describe('previousUtcMonth', () => {
    it('uses the completed previous calendar month from mid-month', () => {
        const period = previousUtcMonth(Date.UTC(2026, 9, 7, 20, 30)); // 7 Oct

        expect(period.slugStamp).toBe('2026-09');
        expect(period.label).toBe('September 2026');
        expect(period.startMs).toBe(Date.UTC(2026, 8, 1));
        expect(period.endMs).toBe(Date.UTC(2026, 9, 1));
        expect(period.dayCount).toBe(30);
    });

    it('uses the previous month when run on the 1st', () => {
        const period = previousUtcMonth(Date.UTC(2026, 9, 1, 8)); // 1 Oct

        expect(period.slugStamp).toBe('2026-09');
        expect(period.label).toBe('September 2026');
    });
});

describe('previousUtcWeek', () => {
    it('uses the completed Mon–Sun week before the current week', () => {
        // Wed 7 Oct 2026 → current week starts Mon 5 Oct → previous Mon 28 Sep–Sun 4 Oct
        const period = previousUtcWeek(Date.UTC(2026, 9, 7, 12));

        expect(period.startMs).toBe(Date.UTC(2026, 8, 28));
        expect(period.endMs).toBe(Date.UTC(2026, 9, 5));
        expect(period.slugStamp).toBe('2026-10-04');
        expect(period.label).toBe('the week of 2026-09-28 to 2026-10-04');
        expect(period.dayCount).toBe(7);
    });

    it('on Monday uses the week that just ended', () => {
        // Mon 5 Oct 2026 → previous Mon 28 Sep–Sun 4 Oct
        const period = previousUtcWeek(Date.UTC(2026, 9, 5, 8));

        expect(period.slugStamp).toBe('2026-10-04');
        expect(period.startMs).toBe(Date.UTC(2026, 8, 28));
        expect(period.endMs).toBe(Date.UTC(2026, 9, 5));
    });
});

describe('isCreatedInPeriod', () => {
    const period = previousUtcMonth(Date.UTC(2026, 9, 7));

    it('includes the first instant of the period', () => {
        expect(isCreatedInPeriod(period.startMs, period)).toBe(true);
    });

    it('excludes the exclusive end', () => {
        expect(isCreatedInPeriod(period.endMs, period)).toBe(false);
    });
});
