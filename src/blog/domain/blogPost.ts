import { Category } from 'jobPost/domain/jobPost';

export const BlogPostType = {
    MonthlyRecap: 'monthlyRecap',
    CategoryAnalysis: 'categoryAnalysis',
} as const;

export type BlogPostKind = (typeof BlogPostType)[keyof typeof BlogPostType];

export type BlogListing = {
    title: string;
    companyName: string;
    salaryLabel: string;
    category: string;
    jobUrl: string;
};

export type BlogPost = {
    slug: string;
    type: BlogPostKind;
    title: string;
    excerpt: string;
    publishedAt: string;
    asOf: string;
    category?: Category;
    paragraphs: string[];
    listings: BlogListing[];
    newsletterUrl: string;
    jobsUrl: string;
    categoryUrl?: string;
    ogImageUrl: string;
};

export type BlogIndexEntry = {
    slug: string;
    type: BlogPostKind;
    title: string;
    excerpt: string;
    publishedAt: string;
    category?: Category;
    ogImageUrl: string;
};

export type BlogIndex = {
    posts: BlogIndexEntry[];
    lastCategory?: Category;
};

export const BLOG_INDEX_PAGE_SIZE = 12;

export const toBlogIndexEntry = (post: BlogPost): BlogIndexEntry => ({
    slug: post.slug,
    type: post.type,
    title: post.title,
    excerpt: post.excerpt,
    publishedAt: post.publishedAt,
    ...(post.category ? { category: post.category } : {}),
    ogImageUrl: post.ogImageUrl,
});

export const upsertBlogIndexPost = (
    index: BlogIndex,
    entry: BlogIndexEntry,
    lastCategory?: Category,
): BlogIndex => {
    const posts = [
        entry,
        ...index.posts.filter((post) => post.slug !== entry.slug),
    ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

    return {
        posts,
        ...(lastCategory
            ? { lastCategory }
            : index.lastCategory
              ? { lastCategory: index.lastCategory }
              : {}),
    };
};
