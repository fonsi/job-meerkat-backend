import { zonedHour } from './nextZonedHour';

/** Max scheduled publications in a 24h window (~1 every 30m). */
export const MAX_PUBLICATIONS_PER_DAY = 46;

/** Company spotlight threads per day when there are enough job promos. */
export const COMPANY_THREADS_PER_DAY = 3;

/** Below this many job promos, add threads until promos + threads reaches it. */
export const MIN_JOB_PROMOS_BEFORE_EXTRA_COMPANY_THREADS = 12;

export const companyThreadCountForPromos = (jobPromoCount: number): number =>
    jobPromoCount >= MIN_JOB_PROMOS_BEFORE_EXTRA_COMPANY_THREADS
        ? COMPANY_THREADS_PER_DAY
        : Math.max(
              COMPANY_THREADS_PER_DAY,
              MIN_JOB_PROMOS_BEFORE_EXTRA_COMPANY_THREADS - jobPromoCount,
          );

/** Newsletter subscribe post when today's new job posts exceed this. */
export const NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS = 20;

/** Local clock for the pinned hot hours (daily analysis, Monday top-paid, newsletter). */
export const SOCIAL_SCHEDULE_TIME_ZONE = 'Europe/Madrid';

/** Daily analysis publish hour in SOCIAL_SCHEDULE_TIME_ZONE. */
export const DAILY_ANALYSIS_HOUR = 17;

/** Weekly top-paid publish hour in SOCIAL_SCHEDULE_TIME_ZONE. Mondays only. */
export const WEEKLY_TOP_PAID_HOUR = 18;

/** Newsletter subscribe publish hour in SOCIAL_SCHEDULE_TIME_ZONE. */
export const NEWSLETTER_SUBSCRIBE_HOUR = 19;

/**
 * Preferred blog promo hour in SOCIAL_SCHEDULE_TIME_ZONE.
 * Kept off daily analysis (17), Monday top-paid (18), and newsletter (19).
 */
export const BLOG_PROMO_HOUR = 16;

/** Space between scheduled posts. */
export const SOCIAL_POST_SLOT_MS = 30 * 60 * 1000;

/**
 * One planner run owns the next day. Production cron is 07:00 UTC so the
 * window still includes 22:00 America/Los_Angeles.
 */
export const SOCIAL_SCHEDULE_HORIZON_MS = 24 * 60 * 60 * 1000;

/** Continental US clocks. A slot counts if any of them is inside the awake range. */
export const SOCIAL_US_TIME_ZONES = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
] as const;

/** 08:00 inclusive, 22:00 exclusive, in each SOCIAL_US_TIME_ZONES zone. */
export const SOCIAL_US_AWAKE_START_HOUR = 8;
export const SOCIAL_US_AWAKE_END_HOUR = 22;

/** US waking slots are chosen this many times more often than other daytime slots. */
export const SOCIAL_US_AWAKE_SLOT_WEIGHT = 2;

/** Light cadence outside US hours, still inside the Madrid day. 08:00 inclusive, 23:00 exclusive. */
export const SOCIAL_LOCAL_DAY_START_HOUR = 8;
export const SOCIAL_LOCAL_DAY_END_HOUR = 23;

const hourInRange = (hour: number, start: number, end: number): boolean =>
    hour >= start && hour < end;

export const isSocialUsAwake = (timestamp: number): boolean =>
    SOCIAL_US_TIME_ZONES.some((timeZone) =>
        hourInRange(
            zonedHour(timestamp, timeZone),
            SOCIAL_US_AWAKE_START_HOUR,
            SOCIAL_US_AWAKE_END_HOUR,
        ),
    );

export const isSocialLocalDaytime = (timestamp: number): boolean =>
    hourInRange(
        zonedHour(timestamp, SOCIAL_SCHEDULE_TIME_ZONE),
        SOCIAL_LOCAL_DAY_START_HOUR,
        SOCIAL_LOCAL_DAY_END_HOUR,
    );
