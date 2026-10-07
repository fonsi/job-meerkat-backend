import { GENERIC_BLOG_OG_KEY, blogPostOgImageKey } from 'blog/domain/blogKeys';
import { BlogPost, BlogPostType } from 'blog/domain/blogPost';
import {
    genericBlogOgExists,
    uploadBlogPostOgImage,
    uploadGenericBlogOgImage,
} from 'blog/infrastructure/assets/s3/uploadBlogOgImage';
import {
    renderBlogPostOgImage,
    renderGenericBlogOgImage,
} from 'blog/infrastructure/og/renderBlogOgImages';
import { loadBrandAssets } from 'jobPost/infrastructure/og/loadBrandAssets';
import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';

const blogOgPublicUrl = (key: string): string => {
    if (!ASSETS_BASE_URL) throw new Error('ASSETS_URL is not set');
    return `${ASSETS_BASE_URL.replace(/\/$/, '')}/${key}`;
};

export const makeGenericBlogOgUrl = (): string =>
    blogOgPublicUrl(GENERIC_BLOG_OG_KEY);

export const makeBlogPostOgUrl = (slug: string): string =>
    blogOgPublicUrl(blogPostOgImageKey(slug));

const typeKicker = (post: Pick<BlogPost, 'type' | 'category'>): string => {
    if (post.type === BlogPostType.CategoryAnalysis && post.category) {
        return `${post.category} jobs`;
    }

    return 'Monthly recap';
};

export const ensureGenericBlogOgImage = async (): Promise<string> => {
    if (!(await genericBlogOgExists())) {
        const brand = await loadBrandAssets();
        const png = await renderGenericBlogOgImage(brand);
        await uploadGenericBlogOgImage(png);
    }

    return makeGenericBlogOgUrl();
};

export const generateAndStoreBlogPostOgImage = async (
    post: Pick<
        BlogPost,
        'slug' | 'title' | 'type' | 'category' | 'publishedAt'
    >,
): Promise<string> => {
    const brand = await loadBrandAssets();
    const png = await renderBlogPostOgImage({
        title: post.title,
        kicker: typeKicker(post),
        dateLabel: post.publishedAt.slice(0, 10),
        mark: brand.mark,
        wordmark: brand.wordmark,
    });
    await uploadBlogPostOgImage({ slug: post.slug, body: png });

    return makeBlogPostOgUrl(post.slug);
};
