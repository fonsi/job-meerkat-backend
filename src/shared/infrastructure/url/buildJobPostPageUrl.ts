import { CompanyId } from 'company/domain/company';

/** Public SPA origin (no trailing slash). */
export const PUBLIC_SITE_BASE_URL = 'https://jobmeerkat.com';

/** Short values — Bluesky/Threads count the full URL toward the limit. */
export const UtmSource = {
    Newsletter: 'newsletter',
    Blog: 'blog',
    /**
     * Shared social copy placeholder; rewritten per platform at publish.
     * `_social` is 7 chars so it matches `bluesky` / `threads` and the URL
     * length does not grow when those sources are applied.
     */
    Social: '_social',
    Bluesky: 'bluesky',
    Threads: 'threads',
} as const;

export type UtmSourceValue = (typeof UtmSource)[keyof typeof UtmSource];

export const getPublicSiteBaseUrl = (): string => PUBLIC_SITE_BASE_URL;

const setQueryParam = (url: string, key: string, value: string): string => {
    const encoded = encodeURIComponent(value);
    const pattern = new RegExp(`([?&]${key}=)[^&]*`);
    if (pattern.test(url)) return url.replace(pattern, `$1${encoded}`);
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}${key}=${encoded}`;
};

export const appendUtmSource = (
    url: string,
    utmSource: UtmSourceValue | string,
): string => setQueryParam(url, 'utm_source', utmSource);

export const appendUtmCampaign = (url: string, campaign: string): string =>
    setQueryParam(url, 'utm_campaign', campaign);

export const withBlogUtm = (url: string, campaign: string): string =>
    appendUtmCampaign(appendUtmSource(url, UtmSource.Blog), campaign);

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
    const url = `${PUBLIC_SITE_BASE_URL}/jobpost/${encodeURIComponent(slug)}`;
    return utmSource ? appendUtmSource(url, utmSource) : url;
};

export const buildRemoteJobsWithSalaryPageUrl = (
    utmSource?: UtmSourceValue | string,
): string => {
    const url = `${PUBLIC_SITE_BASE_URL}/remote-jobs-with-salary`;
    return utmSource ? appendUtmSource(url, utmSource) : url;
};

export const buildNewsletterPageUrl = (
    utmSource?: UtmSourceValue | string,
): string => {
    const url = `${PUBLIC_SITE_BASE_URL}/newsletter`;
    return utmSource ? appendUtmSource(url, utmSource) : url;
};

export const buildBlogPostPageUrl = (
    slug: string,
    utmSource?: UtmSourceValue | string,
): string => {
    const url = `${PUBLIC_SITE_BASE_URL}/blog/${encodeURIComponent(slug)}`;
    return utmSource ? appendUtmSource(url, utmSource) : url;
};

export const buildCategoryPageUrl = (
    categorySlug: string,
    utmSource?: UtmSourceValue | string,
): string => {
    const url = `${PUBLIC_SITE_BASE_URL}/category/${encodeURIComponent(categorySlug)}`;
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
