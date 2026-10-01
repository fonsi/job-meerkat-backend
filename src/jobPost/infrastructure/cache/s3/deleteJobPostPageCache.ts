import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { jobPostPageCacheKey } from 'jobPost/domain/jobPostPageCache';

const client = new S3Client({});

export const deleteJobPostPageCache = async (slug: string): Promise<void> => {
    const bucket = process.env.JOB_POST_CACHE_BUCKET;
    if (!bucket) throw new Error('JOB_POST_CACHE_BUCKET is not set');
    if (!slug) return;

    // S3 DeleteObject is idempotent for missing keys.
    await client.send(
        new DeleteObjectCommand({
            Bucket: bucket,
            Key: jobPostPageCacheKey(slug),
        }),
    );
};
