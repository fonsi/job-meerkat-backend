import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { getJobPostById } from './getJobPostById';
import {
    Category,
    JobPost,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
);

const companyId = '65291817-44b6-4d07-9640-7800eaa2f1ae';
const jobPostId = 'f812fd63-9c68-4c79-a197-cabe5fa3482c';

const mockCompany = {
    id: companyId,
    name: 'Test Company',
    homePage: 'https://test-company.com',
    logo: {
        url: 'https://test-company.com/logo.png',
    },
};

const mockJobPost: JobPost = {
    id: jobPostId,
    originalId: 'original-123',
    companyId: companyId,
    type: JobType.FullTime,
    url: 'https://test-company.com/jobs/123',
    title: 'Senior Developer',
    category: Category.Frontend,
    salaryRange: {
        min: 80000,
        max: 120000,
        currency: 'usd',
        period: Period.Year,
    },
    workplace: Workplace.Remote,
    location: 'Worldwide',
    createdAt: Date.now(),
    closedAt: null,
};

describe('getJobPostById', () => {
    beforeAll(() => {
        (companyRepository.getById as jest.Mock).mockResolvedValue(mockCompany);
        (jobPostRepository.getByIdAndCompanyId as jest.Mock).mockResolvedValue(
            mockJobPost,
        );
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should return job post with company information when found', async () => {
        const result = await getJobPostById(jobPostId, companyId);

        expect(result).toEqual({
            ...mockJobPost,
            company: {
                id: mockCompany.id,
                name: mockCompany.name,
                logo: mockCompany.logo,
            },
        });
        expect(jobPostRepository.getByIdAndCompanyId).toHaveBeenCalledWith(
            jobPostId,
            companyId,
        );
        expect(companyRepository.getById).toHaveBeenCalledWith(companyId);
    });

    test('should return null when job post is not found', async () => {
        (jobPostRepository.getByIdAndCompanyId as jest.Mock).mockResolvedValue(
            null,
        );

        const result = await getJobPostById(jobPostId, companyId);

        expect(result).toBeNull();
        expect(jobPostRepository.getByIdAndCompanyId).toHaveBeenCalledWith(
            jobPostId,
            companyId,
        );
        expect(companyRepository.getById).not.toHaveBeenCalled();
    });
});
