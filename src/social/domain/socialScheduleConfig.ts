/** Max scheduled publications in a 24h window (~1/hour). */
export const MAX_PUBLICATIONS_PER_DAY = 23;

/** X is rate-limited — budget is publications that include X, not tweets. */
export const X_DAILY_PUBLICATION_BUDGET = 16;

/** Space between scheduled posts. */
export const SOCIAL_POST_SLOT_MS = 60 * 60 * 1000;
