import { blogSocialPromoPosts } from './blogPromoPost';

describe('blogSocialPromoPosts', () => {
    it('builds Threads and Bluesky copy with social UTM placeholder and campaign', () => {
        const posts = blogSocialPromoPosts({
            title: 'September remote recap',
            excerpt: 'Salaries and new listings from September.',
            slug: 'remote-job-market-2026-09',
        });

        expect(posts?.threads[0]).toContain('September remote recap');
        expect(posts?.bluesky[0]).toContain(
            'Salaries and new listings from September.',
        );
        expect(posts?.threads[0]).toContain(
            'utm_source=_social&utm_campaign=remote-job-market-2026-09',
        );
        expect(posts?.bluesky[0]).toContain('/blog/remote-job-market-2026-09?');
    });
});
