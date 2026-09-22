import { CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPostId } from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { uploadJobPostOgImage } from 'jobPost/infrastructure/assets/s3/uploadJobPostOgImage';
import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';
import { generateJobPostOgImage } from './generateJobPostOgImage';

const BRAND_WORDMARK_PATH = 'jobmeerkat-logo-text-white.png';

const loadOptionalPng = async (url: string): Promise<Buffer | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        return Buffer.from(await response.arrayBuffer());
    } catch {
        return null;
    }
};

export const generateAndStoreJobPostOgImage = async ({
    companyId,
    jobPostId,
}: {
    companyId: CompanyId;
    jobPostId: JobPostId;
}): Promise<void> => {
    const company = await companyRepository.getById(companyId);
    if (!company) throw new Error(`Company not found - ${companyId}`);

    const jobPost = await jobPostRepository.getByIdAndCompanyId(
        jobPostId,
        companyId,
    );
    if (!jobPost) throw new Error(`Job post not found - ${jobPostId}`);

    const brandUrl = ASSETS_BASE_URL
        ? `${ASSETS_BASE_URL}/${BRAND_WORDMARK_PATH}`
        : null;
    const [logo, brandLogo] = await Promise.all([
        loadOptionalPng(company.logo.url),
        brandUrl ? loadOptionalPng(brandUrl) : Promise.resolve(null),
    ]);
    const png = await generateJobPostOgImage({
        jobPost,
        company,
        logo,
        brandLogo,
    });

    await uploadJobPostOgImage({ companyId, jobPostId, body: png });
};
