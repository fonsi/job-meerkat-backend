import { JobPost } from 'jobPost/domain/jobPost';
import { createJobPost, CreateJobPostCommand } from './createJobPost';
import { CompanyId, Company } from 'company/domain/company';
import { JobType, Period, Workplace, Category } from 'jobPost/domain/jobPost';

jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
    () => ({
        jobPostRepository: {
            create: jest.fn().mockImplementation((jobPost: JobPost) => {
                return Promise.resolve(jobPost);
            }),
        },
    }),
);

const mockTimestamp = 1684166400000; // May 15, 2023 12:00:00 UTC
const originalDateNow = Date.now;
Date.now = jest.fn(() => mockTimestamp);

const companyId = '1' as CompanyId;
const createJobPostCommand: CreateJobPostCommand = {
    title: 'Job Post',
    company: {
        id: companyId,
        name: 'Company',
    } as Company,
    originalId: '1',
    companyId,
    type: JobType.FullTime,
    url: 'https://www.google.com',
    salaryRange: {
        min: 10000,
        max: 20000,
        currency: 'USD',
        period: Period.Month,
    },
    workplace: Workplace.Remote,
    category: Category.Backend,
    location: 'New York',
};

describe('createJobPost', () => {
    afterAll(() => {
        Date.now = originalDateNow;
    });

    it('should create a job post with basic slug', async () => {
        const jobPost = await createJobPost(createJobPostCommand);

        expect(jobPost.title).toBe('Job Post');
        expect(jobPost.slug).toBe('company_job-post_20230515');
        expect(jobPost.createdAt).toBe(mockTimestamp);
    });

    describe('slug generation scenarios', () => {
        const testCases = [
            {
                name: 'with spaces',
                companyName: 'Acme Corp',
                jobTitle: 'Senior Software Engineer',
                expectedSlug: 'acme-corp_senior-software-engineer_20230515',
            },
            {
                name: 'with underscores',
                companyName: 'Acme_Corp',
                jobTitle: 'Senior_Software_Engineer',
                expectedSlug: 'acme-corp_senior-software-engineer_20230515',
            },
            {
                name: 'with special characters',
                companyName: 'Acme@Corp!',
                jobTitle: 'Senior#Software$Engineer',
                expectedSlug: 'acmecorp_seniorsoftwareengineer_20230515',
            },
            {
                name: 'with mixed case',
                companyName: 'AcMe CoRp',
                jobTitle: 'SeNiOr SoFtWaRe EnGiNeEr',
                expectedSlug: 'acme-corp_senior-software-engineer_20230515',
            },
            {
                name: 'with multiple spaces',
                companyName: 'Acme  Corp',
                jobTitle: 'Senior  Software  Engineer',
                expectedSlug: 'acme-corp_senior-software-engineer_20230515',
            },
            {
                name: 'with empty spaces at edges',
                companyName: ' Acme Corp ',
                jobTitle: ' Senior Software Engineer ',
                expectedSlug: 'acme-corp_senior-software-engineer_20230515',
            },
        ];

        test.each(testCases)(
            'should generate correct slug $name',
            async (testCase) => {
                const command = {
                    ...createJobPostCommand,
                    company: {
                        ...createJobPostCommand.company,
                        name: testCase.companyName,
                    },
                    title: testCase.jobTitle,
                };

                const jobPost = await createJobPost(command);
                expect(jobPost.slug).toBe(testCase.expectedSlug);
                expect(jobPost.createdAt).toBe(mockTimestamp);
            },
        );
    });

    it('should use provided createdAt date in slug', async () => {
        const customTimestamp = 1671974400000; // Dec 25, 2022 12:00:00 UTC
        const command = {
            ...createJobPostCommand,
            createdAt: customTimestamp,
        };

        const jobPost = await createJobPost(command);
        expect(jobPost.slug).toBe('company_job-post_20221225');
        expect(jobPost.createdAt).toBe(customTimestamp);
    });
});
