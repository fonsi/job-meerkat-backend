import { HeadObjectCommand, NotFound, S3Client } from '@aws-sdk/client-s3';
import { GENERIC_BLOG_OG_KEY, blogPostOgImageKey } from 'blog/domain/blogKeys';
import { uploadAssetPng } from 'shared/infrastructure/assets/uploadAssetPng';

const client = new S3Client({});

const assetsBucket = (): string => {
    const bucket = process.env.ASSETS_BUCKET?.trim();
    if (!bucket) throw new Error('ASSETS_BUCKET is not set');

    return bucket;
};

export const blogOgAssetExists = async (key: string): Promise<boolean> => {
    try {
        await client.send(
            new HeadObjectCommand({ Bucket: assetsBucket(), Key: key }),
        );
        return true;
    } catch (error) {
        if (error instanceof NotFound) return false;
        const named = error as {
            name?: string;
            Code?: string;
            code?: string;
            $metadata?: { httpStatusCode?: number };
        };
        const code = named.Code ?? named.code ?? named.name;
        // Missing object: 404 when ListBucket is allowed; some SDK builds surface UnknownError.
        if (
            code === 'NotFound' ||
            code === 'NoSuchKey' ||
            named.$metadata?.httpStatusCode === 404
        ) {
            return false;
        }
        throw error;
    }
};

export const genericBlogOgExists = (): Promise<boolean> =>
    blogOgAssetExists(GENERIC_BLOG_OG_KEY);

export const uploadGenericBlogOgImage = (body: Buffer): Promise<void> =>
    uploadAssetPng({ key: GENERIC_BLOG_OG_KEY, body });

export const uploadBlogPostOgImage = ({
    slug,
    body,
}: {
    slug: string;
    body: Buffer;
}): Promise<void> => uploadAssetPng({ key: blogPostOgImageKey(slug), body });
