import {
    GetObjectCommand,
    NoSuchKey,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import {
    BLOG_INDEX_CACHE_KEY,
    blogPostCacheKey,
    blogSnapshotCacheKey,
} from 'blog/domain/blogKeys';
import { BlogIndex, BlogPost } from 'blog/domain/blogPost';
import { BlogMarketSnapshot } from 'blog/domain/blogSnapshot';

const client = new S3Client({});

const cacheBucket = (): string => {
    const bucket = process.env.BLOG_CACHE_BUCKET;
    if (!bucket) throw new Error('BLOG_CACHE_BUCKET is not set');

    return bucket;
};

const isMissingObject = (error: unknown): boolean => {
    if (error instanceof NoSuchKey) return true;
    if (typeof error !== 'object' || error == null) return false;
    const named = error as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
    };

    return (
        named.name === 'NoSuchKey' || named.$metadata?.httpStatusCode === 404
    );
};

const putJson = async (key: string, body: unknown): Promise<void> => {
    await client.send(
        new PutObjectCommand({
            Bucket: cacheBucket(),
            Key: key,
            Body: JSON.stringify(body),
            ContentType: 'application/json',
        }),
    );
};

const getJson = async <T>(key: string): Promise<T | null> => {
    try {
        const result = await client.send(
            new GetObjectCommand({ Bucket: cacheBucket(), Key: key }),
        );
        const body = await result.Body?.transformToString();
        if (!body) return null;

        return JSON.parse(body) as T;
    } catch (error) {
        if (isMissingObject(error)) return null;
        throw error;
    }
};

export const putBlogPostCache = (post: BlogPost): Promise<void> =>
    putJson(blogPostCacheKey(post.slug), post);

export const putBlogSnapshotCache = (
    slug: string,
    snapshot: BlogMarketSnapshot,
): Promise<void> => putJson(blogSnapshotCacheKey(slug), snapshot);

export const putBlogIndexCache = (index: BlogIndex): Promise<void> =>
    putJson(BLOG_INDEX_CACHE_KEY, index);

export const getBlogPostCache = (slug: string): Promise<BlogPost | null> =>
    getJson<BlogPost>(blogPostCacheKey(slug));

export const getBlogIndexCache = async (): Promise<BlogIndex> => {
    const index = await getJson<BlogIndex>(BLOG_INDEX_CACHE_KEY);
    if (!index || !Array.isArray(index.posts)) return { posts: [] };

    return index;
};
