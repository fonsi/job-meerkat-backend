import { nextZonedHour } from './nextZonedHour';
import {
    pickNextFreeSocialSlot,
    reservedPinnedSocialHours,
} from './pickNextFreeSocialSlot';
import {
    BLOG_PROMO_HOUR,
    DAILY_ANALYSIS_HOUR,
    SOCIAL_POST_SLOT_MS,
    SOCIAL_SCHEDULE_TIME_ZONE,
} from './socialScheduleConfig';

describe('pickNextFreeSocialSlot', () => {
    const now = Date.UTC(2026, 9, 1, 8); // Thu 1 Oct 08:00 UTC

    it('prefers the blog promo hour when free', () => {
        const preferred = nextZonedHour(
            now,
            BLOG_PROMO_HOUR,
            SOCIAL_SCHEDULE_TIME_ZONE,
        );

        expect(pickNextFreeSocialSlot({ now, reserved: [] })).toBe(preferred);
    });

    it('skips pinned social hours even when not yet in DynamoDB', () => {
        const preferred = nextZonedHour(
            now,
            BLOG_PROMO_HOUR,
            SOCIAL_SCHEDULE_TIME_ZONE,
        );
        const analysis = nextZonedHour(
            now,
            DAILY_ANALYSIS_HOUR,
            SOCIAL_SCHEDULE_TIME_ZONE,
        );
        const date = pickNextFreeSocialSlot({
            now,
            reserved: reservedPinnedSocialHours(now),
        });

        expect(date).toBe(preferred);
        expect(date).not.toBe(analysis);
        expect(reservedPinnedSocialHours(now)).toContain(analysis);
    });

    it('moves to the next 30m slot when the preferred time is taken', () => {
        const preferred = nextZonedHour(
            now,
            BLOG_PROMO_HOUR,
            SOCIAL_SCHEDULE_TIME_ZONE,
        );
        const date = pickNextFreeSocialSlot({
            now,
            reserved: [preferred, ...reservedPinnedSocialHours(now)],
        });

        expect(date).toBe(preferred + SOCIAL_POST_SLOT_MS);
    });

    it('separates two blog promos scheduled on the same day', () => {
        const first = pickNextFreeSocialSlot({
            now,
            reserved: reservedPinnedSocialHours(now),
        });
        const second = pickNextFreeSocialSlot({
            now,
            reserved: [first, ...reservedPinnedSocialHours(now)],
        });

        expect(second).toBe(first + SOCIAL_POST_SLOT_MS);
    });
});
