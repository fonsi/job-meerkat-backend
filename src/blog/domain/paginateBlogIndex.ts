import { BlogIndex, BlogIndexEntry, BLOG_INDEX_PAGE_SIZE } from './blogPost';

export type PaginatedBlogIndex = {
    posts: BlogIndexEntry[];
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export const paginateBlogIndex = (
    index: BlogIndex,
    page: number,
    pageSize = BLOG_INDEX_PAGE_SIZE,
): PaginatedBlogIndex => {
    const total = index.posts.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Number.isFinite(page)
        ? Math.min(Math.max(1, Math.floor(page)), totalPages)
        : 1;
    const start = (safePage - 1) * pageSize;

    return {
        posts: index.posts.slice(start, start + pageSize),
        page: safePage,
        pageSize,
        total,
        totalPages,
    };
};
