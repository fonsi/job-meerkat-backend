/** Public SPA origin (no trailing slash). */
export const PUBLIC_SITE_BASE_URL = 'https://jobmeerkat.com';

export const getPublicSiteBaseUrl = (): string => PUBLIC_SITE_BASE_URL;

export const buildJobPostPageUrl = (slug: string): string =>
    `${PUBLIC_SITE_BASE_URL}/job/?slug=${encodeURIComponent(slug)}`;
