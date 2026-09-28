import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

const client = new S3Client({});

export const uploadAssetPng = async ({
    key,
    body,
}: {
    key: string;
    body: Buffer;
}): Promise<void> => {
    const bucket = process.env.ASSETS_BUCKET?.trim();
    if (!bucket) throw new Error('ASSETS_BUCKET is not set');

    await client.send(
        new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: 'image/png',
        }),
    );
};
