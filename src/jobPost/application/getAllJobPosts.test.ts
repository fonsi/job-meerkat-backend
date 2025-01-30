import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { getAllJobPosts } from './getAllJobPosts';

jest.useFakeTimers();
jest.setSystemTime(new Date(2025, 0, 15)); // January 15th, 2025;

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
);

const allCompanies = [
    {
        id: 'companyId-1',
        name: 'company 1',
        homePage: 'https://company.1.com',
        logo: 'company1-logo',
    },
    {
        id: 'companyId-2',
        name: 'company 2',
        homePage: 'https://company.2.com',
        logo: 'company2-logo',
    },
];

const allOpenJobPosts = [
    {
        id: 'jobPostId-1',
        companyId: 'companyId-1',
        createdAt: new Date(2024, 10, 10).getTime(), // November 10th, 2024
        closedAt: null,
    },
    {
        id: 'jobPostId-2',
        companyId: 'companyId-2',
        createdAt: new Date(2024, 6, 19).getTime(), // July 19th, 2024, more than six months older
        closedAt: null,
    },
    {
        id: 'jobPostId-3',
        companyId: 'companyId-2',
        createdAt: new Date(2024, 6, 20).getTime(), // July 20th, 2024, almost six months older
        closedAt: null,
    },
];

describe('getAllJobPosts', () => {
    beforeEach(() => {
        (companyRepository.getAll as jest.Mock).mockResolvedValue(allCompanies);
        (jobPostRepository.getAllOpen as jest.Mock).mockResolvedValue(
            allOpenJobPosts,
        );
    });

    test('should return all open job posts newer thant six months', async () => {
        const allJobPosts = await getAllJobPosts();

        expect(allJobPosts).toHaveLength(2);
        expect(allJobPosts).toEqual([
            expect.objectContaining({
                id: 'jobPostId-1',
                company: expect.objectContaining({
                    id: 'companyId-1',
                }),
            }),
            expect.objectContaining({
                id: 'jobPostId-3',
                company: expect.objectContaining({
                    id: 'companyId-2',
                }),
            }),
        ]);
    });
});
