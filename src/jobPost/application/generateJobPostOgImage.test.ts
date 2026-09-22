import { Company, CompanyId } from 'company/domain/company';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { generateJobPostOgImage } from './generateJobPostOgImage';

const companyId = 'company-id' as CompanyId;
const jobPostId = 'job-post-id' as JobPostId;

const company: Company = {
    id: companyId,
    name: 'Federato',
    homePage: 'https://www.federato.ai',
    logo: { url: 'https://example.com/logo.png' },
};

const jobPost: JobPost = {
    id: jobPostId,
    originalId: 'fixture',
    companyId,
    type: JobType.FullTime,
    url: 'https://www.federato.ai/careers',
    title: 'Staff Software Engineer, AI Systems',
    category: Category.AI,
    salaryRange: {
        min: 215000,
        max: 250000,
        currency: 'USD',
        period: Period.Year,
    },
    workplace: Workplace.Remote,
    location: 'unknown',
    createdAt: 1,
    closedAt: null,
    slug: 'staff-software-engineer-ai-systems-at-federato-fixture',
};

const expectPng = (png: Buffer) => {
    expect(png.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(png.readUInt32BE(16)).toBe(1200);
    expect(png.readUInt32BE(20)).toBe(630);
};

describe('generateJobPostOgImage', () => {
    it('renders a 1200x630 PNG', async () => {
        const png = await generateJobPostOgImage({ jobPost, company });

        expectPng(png);
    });

    it('renders a PNG when a company logo is provided', async () => {
        const logo = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64',
        );
        const png = await generateJobPostOgImage({ jobPost, company, logo });

        expectPng(png);
    });
});
