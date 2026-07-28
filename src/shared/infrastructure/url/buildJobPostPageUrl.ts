import { CompanyId } from 'company/domain/company';

/** Public SPA origin (no trailing slash). */
export const PUBLIC_SITE_BASE_URL = 'https://jobmeerkat.com';

/** Short values — Bluesky/Threads count the full URL toward the limit. */
export const UtmSource = {
    Newsletter: 'newsletter',
    /**
     * Shared social copy placeholder; rewritten per platform at publish.
     * `_social` is 7 chars so it matches `bluesky` / `threads` and the URL
     * length does not grow when those sources are applied.
     */
    Social: '_social',
    X: 'x',
    Bluesky: 'bluesky',
    Threads: 'threads',
    LinkedIn: 'linkedin',
} as const;

export type UtmSourceValue = (typeof UtmSource)[keyof typeof UtmSource];

export const getPublicSiteBaseUrl = (): string => PUBLIC_SITE_BASE_URL;

export const appendUtmSource = (
    url: string,
    utmSource: UtmSourceValue | string,
): string => {
    if (/[?&]utm_source=/.test(url)) {
        return url.replace(
            /([?&]utm_source=)[^&]*/,
            `$1${encodeURIComponent(utmSource)}`,
        );
    }
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}utm_source=${encodeURIComponent(utmSource)}`;
};

export const buildPublicSiteUrl = (
    utmSource?: UtmSourceValue | string,
): string =>
    utmSource
        ? appendUtmSource(PUBLIC_SITE_BASE_URL, utmSource)
        : PUBLIC_SITE_BASE_URL;

export const buildJobPostPageUrl = (
    slug: string,
    utmSource?: UtmSourceValue | string,
): string => {
    const url = `${PUBLIC_SITE_BASE_URL}/job/?slug=${encodeURIComponent(slug)}`;
    return utmSource ? appendUtmSource(url, utmSource) : url;
};

export const buildCompanyPageUrl = (
    companyId: CompanyId,
    utmSource?: UtmSourceValue | string,
): string => {
    const url = `${PUBLIC_SITE_BASE_URL}/company/${companyId}`;
    return utmSource ? appendUtmSource(url, utmSource) : url;
};

/** Match Jobmeerkat absolute URLs in plain-text social copy. */
const JOBMEEERKAT_URL_RE = /https:\/\/jobmeerkat\.com[^\s)"]*/g;

export const applyUtmSourceToJobmeerkatUrls = (
    text: string,
    utmSource: UtmSourceValue | string,
): string =>
    text.replace(JOBMEEERKAT_URL_RE, (url) => appendUtmSource(url, utmSource));
