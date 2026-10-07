import { nextZonedHour } from './nextZonedHour';
import {
    BLOG_PROMO_HOUR,
    DAILY_ANALYSIS_HOUR,
    isSocialLocalDaytime,
    isSocialUsAwake,
    NEWSLETTER_SUBSCRIBE_HOUR,
    SOCIAL_POST_SLOT_MS,
    SOCIAL_SCHEDULE_HORIZON_MS,
    SOCIAL_SCHEDULE_TIME_ZONE,
    WEEKLY_TOP_PAID_HOUR,
} from './socialScheduleConfig';

const SLOT_COLLISION_MS = SOCIAL_POST_SLOT_MS / 2;

export const isSocialSlotTaken = (
    candidate: number,
    reserved: number[],
): boolean =>
    reserved.some((date) => Math.abs(date - candidate) < SLOT_COLLISION_MS);

/** Next occurrences of pinned social hours that blog promos should not share. */
export const reservedPinnedSocialHours = (now: number): number[] =>
    [DAILY_ANALYSIS_HOUR, WEEKLY_TOP_PAID_HOUR, NEWSLETTER_SUBSCRIBE_HOUR].map(
        (hour) => nextZonedHour(now, hour, SOCIAL_SCHEDULE_TIME_ZONE),
    );

/**
 * Next free slot for a blog promo: start at the preferred hot hour, then walk
 * 30-minute steps. Prefer US-awake / Madrid daytime slots; never share a slot
 * with reserved times (existing schedule + pinned hours).
 */
export const pickNextFreeSocialSlot = ({
    now,
    reserved,
    preferredHour = BLOG_PROMO_HOUR,
    horizonMs = SOCIAL_SCHEDULE_HORIZON_MS * 2,
}: {
    now: number;
    reserved: number[];
    preferredHour?: number;
    horizonMs?: number;
}): number => {
    const end = now + horizonMs;
    let cursor = nextZonedHour(now, preferredHour, SOCIAL_SCHEDULE_TIME_ZONE);
    let fallback: number | null = null;

    while (cursor < end) {
        if (!isSocialSlotTaken(cursor, reserved)) {
            if (isSocialUsAwake(cursor) || isSocialLocalDaytime(cursor)) {
                return cursor;
            }
            fallback ??= cursor;
        }
        cursor += SOCIAL_POST_SLOT_MS;
    }

    if (fallback != null) return fallback;

    // Absolute fallback: first free 30m step after now.
    cursor = now + SOCIAL_POST_SLOT_MS;
    while (isSocialSlotTaken(cursor, reserved)) {
        cursor += SOCIAL_POST_SLOT_MS;
    }

    return cursor;
};
