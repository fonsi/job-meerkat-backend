import { CompanyId } from 'company/domain/company';
import { JobPostId } from './jobPost';
import { makeJobPostOgImageUrl } from './makeJobPostOgImageUrl';

jest.mock('shared/infrastructure/assets/constants', () => ({
    ASSETS_BASE_URL: 'https://test-assets.com',
}));

describe('makeJobPostOgImageUrl', () => {
    it('builds a fixed asset path from the company and job post ids', () => {
        const companyId = 'company-id' as CompanyId;
        const jobPostId = 'job-post-id' as JobPostId;

        expect(makeJobPostOgImageUrl({ companyId, jobPostId })).toBe(
            'https://test-assets.com/company/company-id/jobpost/job-post-id/og.png',
        );
    });
});
