import {
    putItem,
    transactWriteItems,
    updateItem,
} from 'shared/infrastructure/persistance/dynamodb';
import {
    Category,
    JobPost,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { jobPostRepository } from './dynamodbJobPostRepository';
import { marshallJobPostDetailItem } from './dynamodbJobPostDetailsRepository';

jest.mock('shared/infrastructure/persistance/dynamodb', () => ({
    deleteItem: jest.fn(),
    getItem: jest.fn(),
    putItem: jest.fn(),
    query: jest.fn(),
    scan: jest.fn(),
    transactWriteItems: jest.fn(),
    updateItem: jest.fn(),
}));

const jobPost: JobPost = {
    id: '12345-31231-4123-13123-231312231231',
    originalId: '123456',
    companyId: '8547-5353-4986-4234-985394869',
    type: JobType.FullTime,
    url: 'https://jobs.com/careers/123456',
    title: 'Job title',
    category: Category.Frontend,
    salaryRange: {
        min: 6000,
        max: 7500,
        currency: 'eur',
        period: Period.Month,
    },
    workplace: Workplace.Remote,
    location: 'EMEA',
    createdAt: 1730217826109,
    closedAt: null,
    slug: 'job-title-at-test-company-123e4567',
};

const details = {
    summary: 'Build the customer dashboard.',
    stack: ['TypeScript', 'React'],
};

const jobPostAttributes = {
    id: { S: jobPost.id },
    originalId: { S: jobPost.originalId },
    companyId: { S: jobPost.companyId },
    type: { S: 'fullTime' },
    title: { S: jobPost.title },
    url: { S: jobPost.url },
    category: { S: 'Frontend' },
    workplace: { S: 'remote' },
    location: { S: 'EMEA' },
    createdAt: { N: '1730217826109' },
    slug: { S: jobPost.slug },
    salaryCurrency: { S: 'eur' },
    salaryMin: { N: '6000' },
    salaryMax: { N: '7500' },
    salaryPeriod: { S: 'month' },
};

describe('dynamodbJobPostRepository details writes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('creates a job post and its details in one transaction', async () => {
        await jobPostRepository.create({ ...jobPost, details });

        expect(transactWriteItems).toHaveBeenCalledWith([
            expect.objectContaining({
                Put: expect.objectContaining({
                    Item: expect.objectContaining({
                        id: { S: jobPost.id },
                    }),
                }),
            }),
            {
                Put: {
                    TableName: undefined,
                    Item: marshallJobPostDetailItem(
                        jobPost.id,
                        jobPost.companyId,
                        details,
                    ),
                },
            },
        ]);
        expect(putItem).not.toHaveBeenCalled();
    });

    it('creates a job post without a details write when details are missing', async () => {
        await jobPostRepository.create(jobPost);

        expect(putItem).toHaveBeenCalledTimes(1);
        expect(transactWriteItems).not.toHaveBeenCalled();
    });

    it('archives a job post and deletes details in one transaction', async () => {
        await jobPostRepository.moveClosedToArchive(jobPost, jobPost.createdAt);

        expect(transactWriteItems).toHaveBeenCalledWith([
            expect.objectContaining({ Put: expect.anything() }),
            expect.objectContaining({ Delete: expect.anything() }),
            {
                Delete: {
                    TableName: undefined,
                    Key: { jobPostId: { S: jobPost.id } },
                },
            },
        ]);
    });

    it('does not write details when the job post update finds no item', async () => {
        (updateItem as jest.Mock).mockResolvedValue({});

        await expect(
            jobPostRepository.update({ ...jobPost, details }),
        ).resolves.toBeNull();
        expect(putItem).not.toHaveBeenCalled();
    });

    it('keeps existing details when the update has none', async () => {
        (updateItem as jest.Mock).mockResolvedValue({
            Attributes: jobPostAttributes,
        });

        await jobPostRepository.update(jobPost);

        expect(putItem).not.toHaveBeenCalled();
    });
});
