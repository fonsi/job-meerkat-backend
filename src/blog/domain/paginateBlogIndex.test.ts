import { BlogPostType } from './blogPost';
import { paginateBlogIndex } from './paginateBlogIndex';

const posts = Array.from({ length: 25 }, (_, i) => ({
    slug: `post-${i}`,
    type: BlogPostType.MonthlyRecap,
    title: `Post ${i}`,
    excerpt: 'excerpt',
    publishedAt: `2026-01-${String(25 - i).padStart(2, '0')}T00:00:00.000Z`,
    ogImageUrl: 'https://assets.jobmeerkat.com/blog/og.png',
}));

describe('paginateBlogIndex', () => {
    it('returns the first page by default', () => {
        const page = paginateBlogIndex({ posts }, 1, 12);

        expect(page.page).toBe(1);
        expect(page.totalPages).toBe(3);
        expect(page.posts).toHaveLength(12);
        expect(page.posts[0].slug).toBe('post-0');
    });

    it('clamps an oversized page to the last page', () => {
        const page = paginateBlogIndex({ posts }, 99, 12);

        expect(page.page).toBe(3);
        expect(page.posts).toHaveLength(1);
        expect(page.posts[0].slug).toBe('post-24');
    });
});
