import {
    buildJobPostPageUrl,
    getPublicSiteBaseUrl,
    PUBLIC_SITE_BASE_URL,
} from './buildJobPostPageUrl';

describe('getPublicSiteBaseUrl', () => {
    it('returns the hardcoded production origin', () => {
        expect(getPublicSiteBaseUrl()).toBe(PUBLIC_SITE_BASE_URL);
        expect(PUBLIC_SITE_BASE_URL).toBe('https://jobmeerkat.com');
    });
});

describe('buildJobPostPageUrl', () => {
    it('builds /job/?slug= with the hardcoded base', () => {
        expect(buildJobPostPageUrl('a-b-at-c-d')).toBe(
            'https://jobmeerkat.com/job/?slug=a-b-at-c-d',
        );
    });

    it('encodes the slug query value', () => {
        expect(buildJobPostPageUrl('x y')).toBe(
            'https://jobmeerkat.com/job/?slug=x%20y',
        );
    });
});
