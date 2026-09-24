import {
    appendUtmSource,
    applyUtmSourceToJobmeerkatUrls,
    buildCompanyPageUrl,
    buildJobPostPageUrl,
    buildNewsletterPageUrl,
    buildPublicSiteUrl,
    getPublicSiteBaseUrl,
    PUBLIC_SITE_BASE_URL,
    UtmSource,
} from './buildJobPostPageUrl';
import { applyUtmSourcesToSocialPosts } from './applyUtmSourcesToSocialPosts';

describe('getPublicSiteBaseUrl', () => {
    it('returns the hardcoded production origin', () => {
        expect(getPublicSiteBaseUrl()).toBe(PUBLIC_SITE_BASE_URL);
        expect(PUBLIC_SITE_BASE_URL).toBe('https://jobmeerkat.com');
    });
});

describe('appendUtmSource', () => {
    it('appends utm_source with ? when no query exists', () => {
        expect(
            appendUtmSource('https://jobmeerkat.com', UtmSource.Bluesky),
        ).toBe('https://jobmeerkat.com?utm_source=bluesky');
    });

    it('appends utm_source with & when a query exists', () => {
        expect(
            appendUtmSource(
                'https://jobmeerkat.com/jobpost/a?ref=1',
                UtmSource.Newsletter,
            ),
        ).toBe('https://jobmeerkat.com/jobpost/a?ref=1&utm_source=newsletter');
    });

    it('replaces an existing utm_source', () => {
        expect(
            appendUtmSource(
                'https://jobmeerkat.com?utm_source=_social',
                UtmSource.Bluesky,
            ),
        ).toBe('https://jobmeerkat.com?utm_source=bluesky');
    });
});

describe('buildPublicSiteUrl', () => {
    it('returns the bare origin without utm', () => {
        expect(buildPublicSiteUrl()).toBe('https://jobmeerkat.com');
    });

    it('adds utm_source when provided', () => {
        expect(buildPublicSiteUrl(UtmSource.Threads)).toBe(
            'https://jobmeerkat.com?utm_source=threads',
        );
    });
});

describe('buildJobPostPageUrl', () => {
    it('builds /jobpost/:slug with the hardcoded base', () => {
        expect(buildJobPostPageUrl('a-b-at-c-d')).toBe(
            'https://jobmeerkat.com/jobpost/a-b-at-c-d',
        );
    });

    it('encodes the slug path segment', () => {
        expect(buildJobPostPageUrl('x y')).toBe(
            'https://jobmeerkat.com/jobpost/x%20y',
        );
    });

    it('appends utm_source when provided', () => {
        expect(buildJobPostPageUrl('a-b-at-c-d', UtmSource.Newsletter)).toBe(
            'https://jobmeerkat.com/jobpost/a-b-at-c-d?utm_source=newsletter',
        );
    });
});

describe('buildNewsletterPageUrl', () => {
    it('builds /newsletter with the hardcoded base', () => {
        expect(buildNewsletterPageUrl()).toBe(
            'https://jobmeerkat.com/newsletter',
        );
    });

    it('appends utm_source when provided', () => {
        expect(buildNewsletterPageUrl(UtmSource.Social)).toBe(
            'https://jobmeerkat.com/newsletter?utm_source=_social',
        );
    });
});

describe('buildCompanyPageUrl', () => {
    it('builds /company/:id with the hardcoded base', () => {
        expect(
            buildCompanyPageUrl('123e4567-e89b-12d3-a456-426614174000'),
        ).toBe(
            'https://jobmeerkat.com/company/123e4567-e89b-12d3-a456-426614174000',
        );
    });

    it('appends utm_source when provided', () => {
        expect(
            buildCompanyPageUrl(
                '123e4567-e89b-12d3-a456-426614174000',
                UtmSource.Threads,
            ),
        ).toBe(
            'https://jobmeerkat.com/company/123e4567-e89b-12d3-a456-426614174000?utm_source=threads',
        );
    });
});

describe('applyUtmSourceToJobmeerkatUrls', () => {
    it('tags every jobmeerkat URL in plain text', () => {
        const text =
            'See https://jobmeerkat.com/jobpost/foo and https://jobmeerkat.com';
        expect(applyUtmSourceToJobmeerkatUrls(text, UtmSource.Bluesky)).toBe(
            'See https://jobmeerkat.com/jobpost/foo?utm_source=bluesky and https://jobmeerkat.com?utm_source=bluesky',
        );
    });
});

describe('applyUtmSourcesToSocialPosts', () => {
    it('applies platform-specific utm_source values', () => {
        const tagged = applyUtmSourcesToSocialPosts({
            bluesky: ['https://jobmeerkat.com/company/1'],
            threads: ['https://jobmeerkat.com?utm_source=_social'],
        });

        expect(tagged.bluesky).toEqual([
            'https://jobmeerkat.com/company/1?utm_source=bluesky',
        ]);
        expect(tagged.threads).toEqual([
            'https://jobmeerkat.com?utm_source=threads',
        ]);
    });

    it('rewrites the shared social placeholder per platform', () => {
        const url = buildJobPostPageUrl('foo', UtmSource.Social);
        expect(url).toBe(
            'https://jobmeerkat.com/jobpost/foo?utm_source=_social',
        );

        const tagged = applyUtmSourcesToSocialPosts({
            bluesky: [url],
            threads: [url],
        });

        expect(tagged.bluesky[0]).toContain('utm_source=bluesky');
        expect(tagged.threads[0]).toContain('utm_source=threads');
    });
});
