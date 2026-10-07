export type BlogPeriod = {
    /** Inclusive UTC start (ms). */
    startMs: number;
    /** Exclusive UTC end (ms). */
    endMs: number;
    /** Human label for titles/copy, e.g. "September 2026". */
    label: string;
    /** Stable slug fragment, e.g. "2026-09" or "2026-10-05". */
    slugStamp: string;
    /** Calendar days covered by [startMs, endMs). */
    dayCount: number;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const utcDateStamp = (ms: number): string => {
    const date = new Date(ms);
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const monthLabel = (ms: number): string =>
    new Date(ms).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    });

/** Most recently completed UTC calendar month before `now`. */
export const previousUtcMonth = (now: number): BlogPeriod => {
    const date = new Date(now);
    const startMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1);
    const endMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);

    return {
        startMs,
        endMs,
        label: monthLabel(startMs),
        slugStamp: utcDateStamp(startMs).slice(0, 7),
        dayCount: Math.round((endMs - startMs) / MS_PER_DAY),
    };
};

/**
 * Most recently completed UTC week (Monday 00:00 → next Monday 00:00).
 * Slug stamp is the Sunday that ends that week.
 */
export const previousUtcWeek = (now: number): BlogPeriod => {
    const date = new Date(now);
    const day = date.getUTCDay(); // 0=Sun … 6=Sat
    const daysSinceMonday = (day + 6) % 7;
    const currentWeekStartMs = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate() - daysSinceMonday,
    );
    const startMs = currentWeekStartMs - 7 * MS_PER_DAY;
    const endMs = currentWeekStartMs;
    const weekEndMs = endMs - 1;

    return {
        startMs,
        endMs,
        label: `the week of ${utcDateStamp(startMs)} to ${utcDateStamp(weekEndMs)}`,
        slugStamp: utcDateStamp(weekEndMs),
        dayCount: 7,
    };
};

export const isCreatedInPeriod = (
    createdAt: number,
    period: BlogPeriod,
): boolean => createdAt >= period.startMs && createdAt < period.endMs;
