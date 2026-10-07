import { BlogPostType } from 'blog/domain/blogPost';
import { Category } from 'jobPost/domain/jobPost';
import {
    getBlogIndexCache,
    putBlogIndexCache,
    putBlogPostCache,
    putBlogSnapshotCache,
} from 'blog/infrastructure/cache/s3/blogCache';
import { publishBlogThreadsPromo } from 'blog/infrastructure/social/publishBlogThreadsPromo';
import { publishBlogPost } from './publishBlogPost';
import {
    ensureGenericBlogOgImage,
    generateAndStoreBlogPostOgImage,
} from './generateAndStoreBlogOgImages';

jest.mock('blog/infrastructure/cache/s3/blogCache', () => ({
    getBlogIndexCache: jest.fn(),
    putBlogIndexCache: jest.fn(),
    putBlogPostCache: jest.fn(),
    putBlogSnapshotCache: jest.fn(),
}));
jest.mock('blog/infrastructure/social/publishBlogThreadsPromo', () => ({
    publishBlogThreadsPromo: jest.fn(),
}));
jest.mock('./generateAndStoreBlogOgImages', () => ({
    ensureGenericBlogOgImage: jest.fn(),
    generateAndStoreBlogPostOgImage: jest
        .fn()
        .mockResolvedValue('https://assets.jobmeerkat.com/blog/slug/og.png'),
}));

describe('publishBlogPost', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getBlogIndexCache as jest.Mock).mockResolvedValue({ posts: [] });
        (ensureGenericBlogOgImage as jest.Mock).mockResolvedValue(
            'https://assets.jobmeerkat.com/blog/og.png',
        );
    });

    it('stores the post, snapshot, index, and Threads promo', async () => {
        const snapshot = {
            kind: BlogPostType.CategoryAnalysis,
            slug: 'backend-jobs-2026-10-04',
            asOf: '2026-10-04T23:59:59.999Z',
            periodLabel: 'the week of 2026-09-28 to 2026-10-04',
            periodStart: '2026-09-28',
            periodEnd: '2026-10-04',
            windowDays: 7,
            jobCount: 8,
            newJobCount: 8,
            companyCount: 4,
            medianSalaryLabel: '120K USD/yr',
            maxSalaryLabel: '200K USD/yr',
            topCategories: [],
            workplaces: [],
            listings: [],
            category: { name: Category.Backend, slug: 'backend' },
        };
        const post = await publishBlogPost({
            snapshot,
            draft: {
                title: 'Backend salaries',
                excerpt: 'A look at backend pay.',
                paragraphs: ['Jobs are open.'],
            },
            type: BlogPostType.CategoryAnalysis,
            now: Date.UTC(2026, 9, 4),
        });

        expect(post.slug).toBe('backend-jobs-2026-10-04');
        expect(post.newsletterUrl).toContain('utm_source=blog');
        expect(post.categoryUrl).toContain('/category/backend');
        expect(generateAndStoreBlogPostOgImage).toHaveBeenCalled();
        expect(putBlogPostCache).toHaveBeenCalledWith(post);
        expect(putBlogSnapshotCache).toHaveBeenCalled();
        expect(putBlogIndexCache).toHaveBeenCalledWith(
            expect.objectContaining({
                lastCategory: Category.Backend,
                posts: [expect.objectContaining({ slug: post.slug })],
            }),
        );
        expect(publishBlogThreadsPromo).toHaveBeenCalledWith(post);
    });
});
