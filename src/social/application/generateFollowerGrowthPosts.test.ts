import { Company, CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { jobPostDetailsRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostDetailsRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { openaiCreateFollowerGrowthPosts } from 'shared/infrastructure/ai/openai/openaiCreateFollowerGrowthPosts';
import { openaiPlanFollowerGrowthContent } from 'shared/infrastructure/ai/openai/openaiPlanFollowerGrowthContent';
import { FollowerGrowthContent } from 'social/domain/followerGrowthContent';
import { FollowerGrowthPlan } from 'social/domain/followerGrowthPlan';
import { followerGrowthContentRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbFollowerGrowthContentRepository';
import { generateFollowerGrowthPosts } from './generateFollowerGrowthPosts';

jest.mock(
    'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository',
    () => ({
        companyRepository: { getAll: jest.fn() },
    }),
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
    () => ({
        jobPostRepository: { getAllOpen: jest.fn() },
    }),
);
jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostDetailsRepository',
    () => ({
        jobPostDetailsRepository: { getByJobPostId: jest.fn() },
    }),
);
jest.mock(
    'social/infrastructure/persistance/dynamodb/dynamodbFollowerGrowthContentRepository',
    () => ({
        followerGrowthContentRepository: {
            getAll: jest.fn(),
            add: jest.fn(),
        },
    }),
);
jest.mock(
    'shared/infrastructure/ai/openai/openaiCreateFollowerGrowthPosts',
    () => ({
        openaiCreateFollowerGrowthPosts: jest.fn(),
    }),
);
jest.mock(
    'shared/infrastructure/ai/openai/openaiPlanFollowerGrowthContent',
    () => ({
        openaiPlanFollowerGrowthContent: jest.fn(),
    }),
);

const company: Company = {
    id: 'company-1' as CompanyId,
    name: 'Example',
    homePage: 'https://example.com',
    logo: { url: 'https://example.com/logo.png' },
};
const jobPost = {
    id: 'job-1' as JobPostId,
    originalId: 'job-1',
    companyId: company.id,
    type: JobType.FullTime,
    url: 'https://example.com/job',
    title: 'Backend Engineer',
    category: Category.Backend,
    salaryRange: {
        min: 100000,
        max: 140000,
        currency: 'USD',
        period: Period.Year,
    },
    workplace: Workplace.Remote,
    location: 'Worldwide',
    createdAt: 1000,
    closedAt: null,
    slug: 'backend-engineer',
} as JobPost;
const generatedPosts = {
    family: 'salaryIntelligence' as const,
    topicKey: 'backend-salary-ceiling',
    summary: 'A backend salary ceiling comparison.',
    evidence: [{ id: 'dataset', statement: 'One eligible listing.' }],
    bluesky: ['Bluesky 1', 'Bluesky 2'],
    threads: ['Threads 1', 'Threads 2'],
    x: ['X 1', 'X 2'],
    linkedin: ['LinkedIn'],
};
const plan: FollowerGrowthPlan = {
    family: 'salaryIntelligence',
    angle: 'Compare current USD salary ceilings',
    dataRequests: [
        {
            kind: 'topListings',
            currency: 'USD',
            limit: 1,
        },
    ],
};

describe('generateFollowerGrowthPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (jobPostRepository.getAllOpen as jest.Mock).mockResolvedValue([
            jobPost,
        ]);
        (companyRepository.getAll as jest.Mock).mockResolvedValue([company]);
        (followerGrowthContentRepository.getAll as jest.Mock).mockResolvedValue(
            [],
        );
        (followerGrowthContentRepository.add as jest.Mock).mockResolvedValue(
            undefined,
        );
        (openaiCreateFollowerGrowthPosts as jest.Mock).mockResolvedValue(
            generatedPosts,
        );
        (openaiPlanFollowerGrowthContent as jest.Mock).mockResolvedValue(plan);
    });

    it('generates, records, and returns a requested family', async () => {
        await expect(
            generateFollowerGrowthPosts({
                family: 'salaryIntelligence',
                topic: 'Backend salaries',
            }),
        ).resolves.toEqual(generatedPosts);

        expect(jobPostDetailsRepository.getByJobPostId).not.toHaveBeenCalled();
        expect(openaiPlanFollowerGrowthContent).toHaveBeenCalledWith(
            expect.objectContaining({
                requestedFamily: 'salaryIntelligence',
                topic: 'Backend salaries',
                history: [],
            }),
        );
        expect(openaiCreateFollowerGrowthPosts).toHaveBeenCalledWith(
            expect.objectContaining({
                plan,
                history: [],
                dataset: expect.objectContaining({
                    angle: plan.angle,
                    evidence: expect.any(Array),
                }),
            }),
        );
        expect(followerGrowthContentRepository.add).toHaveBeenCalledWith(
            expect.objectContaining({
                family: 'salaryIntelligence',
                topicKey: generatedPosts.topicKey,
                summary: generatedPosts.summary,
            }),
        );
    });

    it('retries once when the generated topic already exists', async () => {
        const history: FollowerGrowthContent[] = [
            {
                id: 'history-1' as FollowerGrowthContent['id'],
                generatedAt: 1000,
                family: 'salaryIntelligence',
                topicKey: generatedPosts.topicKey,
                summary: 'Already used.',
            },
        ];
        const freshPosts = {
            ...generatedPosts,
            topicKey: 'frontend-salary-ceiling',
        };
        (followerGrowthContentRepository.getAll as jest.Mock).mockResolvedValue(
            history,
        );
        (openaiCreateFollowerGrowthPosts as jest.Mock)
            .mockResolvedValueOnce(generatedPosts)
            .mockResolvedValueOnce(freshPosts);

        await expect(
            generateFollowerGrowthPosts({ family: 'salaryIntelligence' }),
        ).resolves.toEqual(freshPosts);

        expect(openaiCreateFollowerGrowthPosts).toHaveBeenCalledTimes(2);
        expect(openaiCreateFollowerGrowthPosts).toHaveBeenLastCalledWith(
            expect.objectContaining({
                excludedTopicKeys: [generatedPosts.topicKey],
            }),
        );
        expect(followerGrowthContentRepository.add).toHaveBeenCalledTimes(1);
    });

    it('does not persist when the retry still repeats a topic', async () => {
        (followerGrowthContentRepository.getAll as jest.Mock).mockResolvedValue(
            [
                {
                    id: 'history-1',
                    generatedAt: 1000,
                    family: 'salaryIntelligence',
                    topicKey: generatedPosts.topicKey,
                    summary: 'Already used.',
                },
            ],
        );

        await expect(
            generateFollowerGrowthPosts({ family: 'salaryIntelligence' }),
        ).rejects.toThrow('repeated an existing follower-growth topic');
        expect(followerGrowthContentRepository.add).not.toHaveBeenCalled();
    });

    it('re-plans once when requested data is unavailable', async () => {
        const unavailablePlan: FollowerGrowthPlan = {
            family: 'salaryIntelligence',
            angle: 'Analyze listed technology stacks',
            dataRequests: [
                {
                    kind: 'listingDetails',
                    fields: ['stack'],
                    sampleSize: 1,
                },
            ],
        };
        (openaiPlanFollowerGrowthContent as jest.Mock)
            .mockResolvedValueOnce(unavailablePlan)
            .mockResolvedValueOnce(plan);
        (
            jobPostDetailsRepository.getByJobPostId as jest.Mock
        ).mockResolvedValue(undefined);

        await expect(
            generateFollowerGrowthPosts({ family: 'salaryIntelligence' }),
        ).resolves.toEqual(generatedPosts);

        expect(openaiPlanFollowerGrowthContent).toHaveBeenCalledTimes(2);
        expect(openaiPlanFollowerGrowthContent).toHaveBeenLastCalledWith(
            expect.objectContaining({
                availabilityFeedback: expect.arrayContaining([
                    expect.stringContaining('could not be resolved'),
                    expect.stringContaining('No sufficient data'),
                ]),
            }),
        );
    });

    it('falls back to category data when re-planning stays unavailable', async () => {
        const unavailablePlan: FollowerGrowthPlan = {
            family: 'listingTeardown',
            angle: 'Backend stack and responsibilities',
            dataRequests: [
                {
                    kind: 'listingDetails',
                    category: Category.Backend,
                    fields: ['stack', 'responsibilities'],
                    sampleSize: 3,
                },
            ],
        };
        (openaiPlanFollowerGrowthContent as jest.Mock).mockResolvedValue(
            unavailablePlan,
        );
        (
            jobPostDetailsRepository.getByJobPostId as jest.Mock
        ).mockResolvedValue(undefined);

        await expect(
            generateFollowerGrowthPosts({ family: 'listingTeardown' }),
        ).resolves.toEqual(generatedPosts);

        expect(openaiCreateFollowerGrowthPosts).toHaveBeenCalledWith(
            expect.objectContaining({
                plan: expect.objectContaining({
                    dataRequests: [{ kind: 'categoryDistribution' }],
                }),
                dataset: expect.objectContaining({
                    evidence: [
                        expect.objectContaining({
                            statement: expect.stringContaining(
                                'categoryDistribution',
                            ),
                        }),
                    ],
                }),
            }),
        );
    });
});
