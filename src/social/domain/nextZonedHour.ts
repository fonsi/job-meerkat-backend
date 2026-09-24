const pad = (value: number): string => String(value).padStart(2, '0');

const part = (
    parts: Intl.DateTimeFormatPart[],
    type: Intl.DateTimeFormatPartTypes,
): string => parts.find((entry) => entry.type === type)?.value ?? '';

export const zonedDateKey = (timestamp: number, timeZone: string): string => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date(timestamp));

    return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`;
};

const timeZoneOffsetMs = (utcMs: number, timeZone: string): number => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hourCycle: 'h23',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).formatToParts(new Date(utcMs));
    const asUtc = Date.UTC(
        Number(part(parts, 'year')),
        Number(part(parts, 'month')) - 1,
        Number(part(parts, 'day')),
        Number(part(parts, 'hour')),
        Number(part(parts, 'minute')),
        Number(part(parts, 'second')),
    );

    return asUtc - utcMs;
};

const addDays = (dateKey: string, days: number): string => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const utc = new Date(Date.UTC(year, month - 1, day + days));

    return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
};

/** UTC timestamp of hour:00 on a local calendar day in timeZone. */
export const zonedHourTimestamp = (
    dateKey: string,
    hour: number,
    timeZone: string,
): number => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const utcGuess = Date.UTC(year, month - 1, day, hour, 0, 0, 0);
    const offset = timeZoneOffsetMs(utcGuess, timeZone);
    const utc = utcGuess - offset;
    const offsetAtResult = timeZoneOffsetMs(utc, timeZone);
    if (offsetAtResult === offset) return utc;

    return utcGuess - offsetAtResult;
};

/** Next hour:00 in timeZone strictly after now. */
export const nextZonedHour = (
    now: number,
    hour: number,
    timeZone: string,
): number => {
    const todayKey = zonedDateKey(now, timeZone);
    const today = zonedHourTimestamp(todayKey, hour, timeZone);
    if (today > now) return today;

    return zonedHourTimestamp(addDays(todayKey, 1), hour, timeZone);
};
