import { nextZonedHour } from './nextZonedHour';
import { SOCIAL_SCHEDULE_TIME_ZONE } from './socialScheduleConfig';

describe('nextZonedHour', () => {
    const timeZone = SOCIAL_SCHEDULE_TIME_ZONE;

    it('returns 17:00 and 19:00 Madrid the same day in summer', () => {
        const now = Date.UTC(2026, 6, 21, 2);

        expect(nextZonedHour(now, 17, timeZone)).toBe(
            Date.UTC(2026, 6, 21, 15),
        );
        expect(nextZonedHour(now, 19, timeZone)).toBe(
            Date.UTC(2026, 6, 21, 17),
        );
    });

    it('returns 17:00 and 19:00 Madrid the same day in winter', () => {
        const now = Date.UTC(2026, 0, 15, 2);

        expect(nextZonedHour(now, 17, timeZone)).toBe(
            Date.UTC(2026, 0, 15, 16),
        );
        expect(nextZonedHour(now, 19, timeZone)).toBe(
            Date.UTC(2026, 0, 15, 18),
        );
    });

    it('moves to the next local day once that hour has passed', () => {
        const now = Date.UTC(2026, 6, 21, 16);

        expect(nextZonedHour(now, 17, timeZone)).toBe(
            Date.UTC(2026, 6, 22, 15),
        );
    });
});
