import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CompanyId } from 'company/domain/company';
import { makeJobPostOgImageKey } from 'jobPost/domain/makeJobPostOgImageUrl';
import { JobPostId } from 'jobPost/domain/jobPost';

const client = new S3Client({});

export const uploadJobPostOgImage = async ({
    companyId,
    jobPostId,
    body,
}: {
    companyId: CompanyId;
    jobPostId: JobPostId;
    body: Buffer;
}): Promise<void> => {
    const bucket = process.env.ASSETS_BUCKET;
    if (!bucket) throw new Error('ASSETS_BUCKET is not set');

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: makeJobPostOgImageKey({ companyId, jobPostId }),
            Body: body,
            ContentType: 'image/png',
        }),
    );
};
