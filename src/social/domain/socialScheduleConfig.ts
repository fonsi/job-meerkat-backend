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

/** Newsletter subscribe post when today's new remote jobs with a public salary exceed this. */
export const NEWSLETTER_SUBSCRIBE_MIN_NEW_JOBS = 50;

/** Local clock for posts pinned to the evening activity window. */
export const SOCIAL_SCHEDULE_TIME_ZONE = 'Europe/Madrid';

/** Daily analysis publish hour in SOCIAL_SCHEDULE_TIME_ZONE. */
export const DAILY_ANALYSIS_HOUR = 17;

/** Weekly top-paid publish hour in SOCIAL_SCHEDULE_TIME_ZONE. Mondays only. */
export const WEEKLY_TOP_PAID_HOUR = 18;

/** Newsletter subscribe publish hour in SOCIAL_SCHEDULE_TIME_ZONE. */
export const NEWSLETTER_SUBSCRIBE_HOUR = 19;

/** Space between scheduled posts. */
export const SOCIAL_POST_SLOT_MS = 30 * 60 * 1000;
