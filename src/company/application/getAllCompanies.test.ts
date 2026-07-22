import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { CompanyWithJobPostsCount, getAllCompanies } from './getAllCompanies';
import { JobPost, JobPostId } from 'jobPost/domain/jobPost';

jest.useFakeTimers();
jest.setSystemTime(new Date(2025, 0, 15)); // January 15th, 2025

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
);

const companyId1 = '1' as CompanyId;
const companyId2 = '2' as CompanyId;
const companyId3 = '3' as CompanyId;

const allCompanies: Company[] = [
    {
        id: companyId1,
    } as Company,
    {
        id: companyId2,
    } as Company,
    {
        id: companyId3,
    } as Company,
];

const allCompaniesWithJobPostsCount: CompanyWithJobPostsCount[] = [
    {
        id: companyId1,
        jobPostsCount: 1,
    } as CompanyWithJobPostsCount,
    {
        id: companyId2,
        jobPostsCount: 1,
    } as CompanyWithJobPostsCount,
    {
        id: companyId3,
        jobPostsCount: 0,
    } as CompanyWithJobPostsCount,
];

const allOpenJobPosts: JobPost[] = [
    {
        id: '1' as JobPostId,
        companyId: companyId1,
        createdAt: new Date(2024, 10, 10).getTime(), // November 10th, 2024
    } as JobPost,
    {
        id: '2' as JobPostId,
        companyId: companyId2,
        createdAt: new Date(2024, 6, 20).getTime(), // July 20th, 2024, almost six months older
    } as JobPost,
    {
        id: '3' as JobPostId,
        companyId: companyId1,
        createdAt: new Date(2024, 6, 19).getTime(), // July 19th, 2024, more than six months older
    } as JobPost,
];

describe('getAllCompanies', () => {
    beforeEach(() => {
        (companyRepository.getAll as jest.Mock).mockResolvedValue(allCompanies);
        (
            jobPostRepository.getAllOpenByCompanyId as jest.Mock
        ).mockImplementation((companyId: CompanyId) =>
            allOpenJobPosts.filter(
                (jobPost) => jobPost.companyId === companyId,
            ),
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should return all companies', async () => {
        const companies = await getAllCompanies({ countJobPosts: false });

        expect(companies).toEqual(allCompanies);
    });

    test('should return all companies with job posts count newer than six months', async () => {
        const companies = await getAllCompanies({ countJobPosts: true });

        expect(companies).toEqual(allCompaniesWithJobPostsCount);
    });
});
