import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
    JobPostPageCache,
    jobPostPageCacheKey,
} from 'jobPost/domain/jobPostPageCache';

const client = new S3Client({});

export const putJobPostPageCache = async (
    page: JobPostPageCache,
): Promise<void> => {
    const bucket = process.env.JOB_POST_CACHE_BUCKET;
    if (!bucket) throw new Error('JOB_POST_CACHE_BUCKET is not set');

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: jobPostPageCacheKey(page.slug),
            Body: JSON.stringify(page),
            ContentType: 'application/json',
        }),
    );
};
