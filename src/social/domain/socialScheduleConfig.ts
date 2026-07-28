/** Max scheduled publications in a 24h window (~1 every 30m). */
export const MAX_PUBLICATIONS_PER_DAY = 46;

/** Company spotlight threads per day (Threads + Bluesky only). */
export const COMPANY_THREADS_PER_DAY = 3;

/** X is rate-limited — budget is publications that include X, not tweets. */
export const X_DAILY_PUBLICATION_BUDGET = 16;

/** Space between scheduled posts. */
export const SOCIAL_POST_SLOT_MS = 30 * 60 * 1000;
