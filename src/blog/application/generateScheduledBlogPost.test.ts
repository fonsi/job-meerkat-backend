import { BlogPostType } from 'blog/domain/blogPost';
import { getBlogIndexCache } from 'blog/infrastructure/cache/s3/blogCache';
import { openaiDraftBlogPost } from 'blog/infrastructure/ai/openai/openaiDraftBlogPost';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { Category } from 'jobPost/domain/jobPost';
import {
    generateScheduledBlogPost,
    parseBlogPostKind,
} from './generateScheduledBlogPost';
import { publishBlogPost } from './publishBlogPost';
import {
    buildCategoryAnalysisSnapshot,
    buildMonthlyRecapSnapshot,
} from './buildBlogSnapshot';

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
    () => ({ companyRepository: { getAll: jest.fn() } }),
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
    () => ({ jobPostRepository: { getAllOpen: jest.fn() } }),
);
jest.mock('blog/infrastructure/cache/s3/blogCache', () => ({
    getBlogIndexCache: jest.fn(),
}));
jest.mock('blog/infrastructure/ai/openai/openaiDraftBlogPost', () => ({
    openaiDraftBlogPost: jest.fn(),
}));
jest.mock('./publishBlogPost', () => ({
    publishBlogPost: jest.fn(),
}));
jest.mock('./buildBlogSnapshot', () => ({
    buildMonthlyRecapSnapshot: jest.fn(),
    buildCategoryAnalysisSnapshot: jest.fn(),
}));

describe('parseBlogPostKind', () => {
    it('defaults to monthly recap', () => {
        expect(parseBlogPostKind(undefined)).toBe(BlogPostType.MonthlyRecap);
        expect(parseBlogPostKind(BlogPostType.CategoryAnalysis)).toBe(
            BlogPostType.CategoryAnalysis,
        );
    });
});

describe('generateScheduledBlogPost', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (companyRepository.getAll as jest.Mock).mockResolvedValue([]);
        (jobPostRepository.getAllOpen as jest.Mock).mockResolvedValue([]);
        (openaiDraftBlogPost as jest.Mock).mockResolvedValue({
            title: 'Title',
            excerpt: 'Excerpt',
            paragraphs: ['Hello'],
        });
        (publishBlogPost as jest.Mock).mockResolvedValue({ slug: 'published' });
        (getBlogIndexCache as jest.Mock).mockResolvedValue({ posts: [] });
    });

    it('skips a monthly recap when the snapshot is missing', async () => {
        (buildMonthlyRecapSnapshot as jest.Mock).mockReturnValue(null);

        await expect(
            generateScheduledBlogPost(BlogPostType.MonthlyRecap),
        ).resolves.toEqual({
            status: 'skipped',
            reason: 'monthly sample too small',
        });
        expect(publishBlogPost).not.toHaveBeenCalled();
    });

    it('publishes a monthly recap', async () => {
        (buildMonthlyRecapSnapshot as jest.Mock).mockReturnValue({
            slug: 'remote-job-market-2026-10',
        });

        const result = await generateScheduledBlogPost(
            BlogPostType.MonthlyRecap,
        );

        expect(result.status).toBe('published');
        expect(publishBlogPost).toHaveBeenCalled();
    });

    it('tries categories until one has enough data', async () => {
        (buildCategoryAnalysisSnapshot as jest.Mock)
            .mockReturnValueOnce(null)
            .mockReturnValueOnce({ slug: 'frontend-jobs-2026-10-04' });

        const result = await generateScheduledBlogPost(
            BlogPostType.CategoryAnalysis,
        );

        expect(result.status).toBe('published');
        expect(buildCategoryAnalysisSnapshot).toHaveBeenCalled();
        expect(
            (buildCategoryAnalysisSnapshot as jest.Mock).mock.calls[0][0]
                .category,
        ).toBe(Category.Backend);
    });
});
