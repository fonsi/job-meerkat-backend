/** Keys in the private `${stage}-blog-cache` bucket. */
export const blogPostCacheKey = (slug: string): string => `${slug}.json`;

export const blogSnapshotCacheKey = (slug: string): string =>
    `${slug}.snapshot.json`;

export const BLOG_INDEX_CACHE_KEY = 'index.json';

/** Keys in the public assets bucket. */
export const GENERIC_BLOG_OG_KEY = 'blog/og.png';

export const blogPostOgImageKey = (slug: string): string =>
    `blog/${slug}/og.png`;
