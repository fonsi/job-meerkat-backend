import { processCompany } from './processCompany';
import { Company, CompanyId } from 'company/domain/company';
import { JobPost, JobType, Category, Workplace } from 'jobPost/domain/jobPost';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { getNewCompanyScrapper } from 'company/infrastructure/scrapping/companyScrapper';
import { createJobPost } from 'jobPost/application/createJobPost';
import { closeJobPost } from 'jobPost/application/closeJobPost';

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
            getAllByCompanyId: jest.fn(),
            update: jest.fn().mockResolvedValue(undefined),
        },
    }),
);

jest.mock('company/infrastructure/scrapping/companyScrapper', () => ({
    getNewCompanyScrapper: jest.fn(),
}));

jest.mock('jobPost/application/createJobPost', () => ({
    createJobPost: jest.fn(),
}));

jest.mock('jobPost/application/closeJobPost', () => ({
    closeJobPost: jest.fn(),
}));

describe('processCompany', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('reopens an existing closed job post instead of creating a duplicate', async () => {
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const company = {
            id: companyId,
            name: 'test-company',
            homePage: 'https://example.com',
            logo: {
                url: 'https://assets.example.com/company.png',
            },
        } as unknown as Company;

        const closedJobPost = {
            id: '123e4567-e89b-12d3-a456-426614174111',
            companyId,
            originalId: 'external-1',
            type: JobType.FullTime,
            title: 'Backend Engineer',
            url: 'https://jobs.example.com/1',
            category: Category.Backend,
            salaryRange: null,
            workplace: Workplace.Remote,
            location: 'worldwide',
            createdAt: 1700000000000,
            closedAt: 1701000000000,
            slug: 'backend-engineer-at-test-company-post1',
        } as unknown as JobPost;

        (companyRepository.getById as jest.Mock).mockResolvedValue(company);
        (jobPostRepository.getAllByCompanyId as jest.Mock).mockResolvedValue([
            closedJobPost,
        ]);

        (getNewCompanyScrapper as jest.Mock).mockReturnValue(() => ({
            getListedJobPostsData: jest.fn().mockResolvedValue([
                {
                    id: 'external-1',
                    url: 'https://jobs.example.com/1',
                    title: 'Backend Engineer',
                },
            ]),
            scrapJobPost: jest.fn().mockResolvedValue([
                {
                    originalId: 'external-1',
                    companyId,
                    type: JobType.FullTime,
                    title: 'Backend Engineer Updated',
                    url: 'https://jobs.example.com/1',
                    category: Category.Backend,
                    salaryRange: null,
                    workplace: Workplace.Remote,
                    location: 'worldwide',
                },
            ]),
        }));

        await processCompany({ companyId });

        expect(jobPostRepository.update).toHaveBeenCalledTimes(1);
        expect(createJobPost).not.toHaveBeenCalled();
        expect(closeJobPost).not.toHaveBeenCalled();
    });
});
