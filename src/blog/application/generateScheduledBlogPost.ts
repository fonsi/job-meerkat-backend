import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { openaiDraftBlogPost } from 'blog/infrastructure/ai/openai/openaiDraftBlogPost';
import { getBlogIndexCache } from 'blog/infrastructure/cache/s3/blogCache';
import { BlogPost, BlogPostKind, BlogPostType } from 'blog/domain/blogPost';
import { categoryAnalysisSlug, monthlyRecapSlug } from 'blog/domain/blogSlugs';
import { nextCategoriesToTry } from 'blog/domain/selectNextCategory';
import {
    buildCategoryAnalysisSnapshot,
    buildMonthlyRecapSnapshot,
} from './buildBlogSnapshot';
import { publishBlogPost } from './publishBlogPost';

export type GenerateBlogResult =
    | { status: 'published'; post: BlogPost }
    | { status: 'skipped'; reason: string };

export const parseBlogPostKind = (value: string | undefined): BlogPostKind => {
    if (value === BlogPostType.CategoryAnalysis) {
        return BlogPostType.CategoryAnalysis;
    }

    return BlogPostType.MonthlyRecap;
};

export const generateScheduledBlogPost = async (
    kind: BlogPostKind,
    now = Date.now(),
): Promise<GenerateBlogResult> => {
    const [jobPosts, companies] = await Promise.all([
        jobPostRepository.getAllOpen(),
        companyRepository.getAll(),
    ]);

    if (kind === BlogPostType.MonthlyRecap) {
        const slug = monthlyRecapSlug(now);
        const snapshot = buildMonthlyRecapSnapshot({
            jobPosts,
            companies,
            slug,
            now,
        });
        if (!snapshot) {
            return {
                status: 'skipped',
                reason: 'monthly sample too small',
            };
        }
        const draft = await openaiDraftBlogPost(snapshot);
        const post = await publishBlogPost({
            snapshot,
            draft,
            type: BlogPostType.MonthlyRecap,
            now,
        });

        return { status: 'published', post };
    }

    const index = await getBlogIndexCache();
    for (const category of nextCategoriesToTry(index)) {
        const slug = categoryAnalysisSlug(category, now);
        const snapshot = buildCategoryAnalysisSnapshot({
            jobPosts,
            companies,
            slug,
            category,
            now,
        });
        if (!snapshot) continue;
        const draft = await openaiDraftBlogPost(snapshot);
        const post = await publishBlogPost({
            snapshot,
            draft,
            type: BlogPostType.CategoryAnalysis,
            now,
        });

        return { status: 'published', post };
    }

    return {
        status: 'skipped',
        reason: 'no category with a large enough sample',
    };
};
