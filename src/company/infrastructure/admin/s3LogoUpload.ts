import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CompanyId } from 'company/domain/company';
import { makeCompanyOgImageKey } from 'company/domain/makeCompanyOgImageUrl';
import { ASSETS_BUCKET, LOGO_OBJECT_CACHE_CONTROL } from './constants';

const awsRegion = (): string =>
    process.env.AWS_REGION || process.env.REGION || 'eu-west-1';

export const companyLogoObjectKey = (companyId: CompanyId): string =>
    `company/${companyId}/logo.png`;

const putPng = async (key: string, body: Buffer): Promise<void> => {
    const client = new S3Client({ region: awsRegion() });
    await client.send(
        new PutObjectCommand({
            Bucket: ASSETS_BUCKET,
            Key: key,
            Body: body,
            ContentType: 'image/png',
            CacheControl: LOGO_OBJECT_CACHE_CONTROL,
        }),
    );
};

export const uploadCompanyLogo = async ({
    companyId,
    body,
}: {
    companyId: CompanyId;
    body: Buffer;
}): Promise<void> => putPng(companyLogoObjectKey(companyId), body);

export const uploadCompanyOg = async ({
    companyId,
    body,
}: {
    companyId: CompanyId;
    body: Buffer;
}): Promise<void> => putPng(makeCompanyOgImageKey({ companyId }), body);
