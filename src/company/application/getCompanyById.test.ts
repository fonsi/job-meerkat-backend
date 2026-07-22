import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { getCompanyById } from './getCompanyById';

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
);

const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;

describe('getCompanyById', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns open job posts for an active company', async () => {
        const company = {
            id: companyId,
            name: 'Active Co',
            homePage: 'https://example.com',
            logo: { url: 'https://assets.example.com/logo.png' },
        } as Company;
        const openJobPosts = [{ id: 'job-1' }];

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (
            jobPostRepository.getAllOpenByCompanyId as jest.Mock
        ).mockResolvedValue(openJobPosts);

        await expect(
            getCompanyById({ id: companyId, includeOpenJobPosts: true }),
        ).resolves.toEqual({ company, openJobPosts });
    });

    it('returns empty openJobPosts and skips loading jobs when disabled', async () => {
        const company = {
            id: companyId,
            name: 'Disabled Co',
            homePage: 'https://example.com',
            logo: { url: 'https://assets.example.com/logo.png' },
            status: 'disabled',
            statusMessage: 'Shut down',
        } as Company;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);

        await expect(
            getCompanyById({ id: companyId, includeOpenJobPosts: true }),
        ).resolves.toEqual({ company, openJobPosts: [] });
        expect(jobPostRepository.getAllOpenByCompanyId).not.toHaveBeenCalled();
    });
});
