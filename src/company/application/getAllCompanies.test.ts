import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { CompanyWithJobPostsCount, getAllCompanies } from './getAllCompanies';
import { JobPost, JobPostId } from 'jobPost/domain/jobPost';

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
        jobPostsCount: 2,
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
    } as JobPost,
    {
        id: '2' as JobPostId,
        companyId: companyId2,
    } as JobPost,
    {
        id: '3' as JobPostId,
        companyId: companyId1,
    } as JobPost,
];

describe('getAllCompanies', () => {
    beforeEach(() => {
        (companyRepository.getAll as jest.Mock).mockResolvedValue(allCompanies);
        (jobPostRepository.getAllOpen as jest.Mock).mockResolvedValue(
            allOpenJobPosts,
        );
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('should return all companies', async () => {
        const companies = await getAllCompanies({ countJobPosts: false });

        expect(companies).toEqual(allCompanies);
    });

    test('should return all companies with job posts count', async () => {
        const companies = await getAllCompanies({ countJobPosts: true });

        expect(companies).toEqual(allCompaniesWithJobPostsCount);
    });
});
