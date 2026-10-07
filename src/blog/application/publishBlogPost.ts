import { BlogDraft } from 'blog/infrastructure/ai/openai/openaiDraftBlogPost';
import { BlogMarketSnapshot } from 'blog/domain/blogSnapshot';
import {
    BlogPost,
    BlogPostKind,
    upsertBlogIndexPost,
} from 'blog/domain/blogPost';
import {
    getBlogIndexCache,
    putBlogIndexCache,
    putBlogPostCache,
    putBlogSnapshotCache,
} from 'blog/infrastructure/cache/s3/blogCache';
import {
    ensureGenericBlogOgImage,
    generateAndStoreBlogPostOgImage,
} from './generateAndStoreBlogOgImages';
import { publishBlogThreadsPromo } from 'blog/infrastructure/social/publishBlogThreadsPromo';
import {
    buildCategoryPageUrl,
    buildNewsletterPageUrl,
    buildRemoteJobsWithSalaryPageUrl,
    UtmSource,
    withBlogUtm,
} from 'shared/infrastructure/url/buildJobPostPageUrl';

export const publishBlogPost = async ({
    snapshot,
    draft,
    type,
    now = Date.now(),
    promoThreads = true,
}: {
    snapshot: BlogMarketSnapshot;
    draft: BlogDraft;
    type: BlogPostKind;
    now?: number;
    promoThreads?: boolean;
}): Promise<BlogPost> => {
    await ensureGenericBlogOgImage();
    const publishedAt = new Date(now).toISOString();
    const ogImageUrl = await generateAndStoreBlogPostOgImage({
        slug: snapshot.slug,
        title: draft.title,
        type,
        publishedAt,
        ...(snapshot.category ? { category: snapshot.category.name } : {}),
    });

    const post: BlogPost = {
        slug: snapshot.slug,
        type,
        title: draft.title,
        excerpt: draft.excerpt,
        publishedAt,
        asOf: snapshot.asOf,
        paragraphs: draft.paragraphs,
        listings: snapshot.listings,
        newsletterUrl: withBlogUtm(
            buildNewsletterPageUrl(UtmSource.Blog),
            snapshot.slug,
        ),
        jobsUrl: withBlogUtm(
            buildRemoteJobsWithSalaryPageUrl(UtmSource.Blog),
            snapshot.slug,
        ),
        ogImageUrl,
        ...(snapshot.category
            ? {
                  category: snapshot.category.name,
                  categoryUrl: withBlogUtm(
                      buildCategoryPageUrl(
                          snapshot.category.slug,
                          UtmSource.Blog,
                      ),
                      snapshot.slug,
                  ),
              }
            : {}),
    };

    const index = upsertBlogIndexPost(
        await getBlogIndexCache(),
        {
            slug: post.slug,
            type: post.type,
            title: post.title,
            excerpt: post.excerpt,
            publishedAt: post.publishedAt,
            ogImageUrl: post.ogImageUrl,
            ...(post.category ? { category: post.category } : {}),
        },
        post.category,
    );

    await Promise.all([
        putBlogPostCache(post),
        putBlogSnapshotCache(post.slug, snapshot),
        putBlogIndexCache(index),
    ]);

    if (promoThreads) await publishBlogThreadsPromo(post);

    return post;
};
