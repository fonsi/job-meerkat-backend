import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Workplace,
} from 'jobPost/domain/jobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { uploadJobPostOgImage } from 'jobPost/infrastructure/assets/s3/uploadJobPostOgImage';
import { generateAndStoreJobPostOgImage } from './generateAndStoreJobPostOgImage';
import { generateJobPostOgImage } from './generateJobPostOgImage';

jest.mock('shared/infrastructure/assets/constants', () => ({
    ASSETS_BASE_URL: 'https://test-assets.com',
}));

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
    () => ({
        companyRepository: {
            getById: jest.fn(),
        },
    }),
);

jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
    () => ({
        jobPostRepository: {
            getByIdAndCompanyId: jest.fn(),
        },
    }),
);

jest.mock('jobPost/infrastructure/assets/s3/uploadJobPostOgImage', () => ({
    uploadJobPostOgImage: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('./generateJobPostOgImage', () => ({
    generateJobPostOgImage: jest.fn().mockResolvedValue(Buffer.from('png')),
}));

const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
const jobPostId = '123e4567-e89b-12d3-a456-426614174111' as JobPostId;

const company = {
    id: companyId,
    name: 'Federato',
    homePage: 'https://www.federato.ai',
    logo: { url: 'https://test-assets.com/company/logo.png' },
} as Company;

const jobPost = {
    id: jobPostId,
    companyId,
    originalId: 'external-1',
    type: JobType.FullTime,
    title: 'Staff Software Engineer',
    url: 'https://jobs.example.com/1',
    category: Category.AI,
    salaryRange: null,
    workplace: Workplace.Remote,
    location: 'unknown',
    createdAt: 1,
    closedAt: null,
    slug: 'staff-software-engineer',
} as JobPost;

describe('generateAndStoreJobPostOgImage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getByIdAndCompanyId as jest.Mock).mockResolvedValue(
            jobPost,
        );
        global.fetch = jest.fn(async (url: string) => ({
            ok: url.includes('logo-text-white') || url.includes('company/logo'),
            arrayBuffer: async () => Uint8Array.from([1, 2, 3]).buffer,
        })) as unknown as typeof fetch;
    });

    it('renders the job post and uploads the png', async () => {
        await generateAndStoreJobPostOgImage({ companyId, jobPostId });

        expect(generateJobPostOgImage).toHaveBeenCalledWith(
            expect.objectContaining({
                jobPost,
                company,
                logo: expect.any(Buffer),
                brandLogo: expect.any(Buffer),
            }),
        );
        expect(uploadJobPostOgImage).toHaveBeenCalledWith({
            companyId,
            jobPostId,
            body: Buffer.from('png'),
        });
    });

    it('still renders when the company logo is missing', async () => {
        global.fetch = jest.fn(async () => ({
            ok: false,
            arrayBuffer: async () => new ArrayBuffer(0),
        })) as unknown as typeof fetch;

        await generateAndStoreJobPostOgImage({ companyId, jobPostId });

        expect(generateJobPostOgImage).toHaveBeenCalledWith(
            expect.objectContaining({ logo: null, brandLogo: null }),
        );
    });
});
