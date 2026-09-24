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
import { openaiPlanFollowerGrowthConcept } from 'shared/infrastructure/ai/openai/openaiPlanFollowerGrowthConcept';
import { openaiPlanFollowerGrowthContent } from 'shared/infrastructure/ai/openai/openaiPlanFollowerGrowthContent';
import { openaiReviewFollowerGrowthPosts } from 'shared/infrastructure/ai/openai/openaiReviewFollowerGrowthPosts';
import { FollowerGrowthContent } from 'social/domain/followerGrowthContent';
import {
    FollowerGrowthConcept,
    FollowerGrowthPlan,
} from 'social/domain/followerGrowthPlan';
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
    'shared/infrastructure/ai/openai/openaiReviewFollowerGrowthPosts',
    () => ({
        openaiReviewFollowerGrowthPosts: jest.fn(),
    }),
);
jest.mock(
    'shared/infrastructure/ai/openai/openaiPlanFollowerGrowthConcept',
    () => ({
        openaiPlanFollowerGrowthConcept: jest.fn(),
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
const concept: FollowerGrowthConcept = {
    family: 'salaryIntelligence',
    readerProblem:
        'A salary range reaches a reader’s minimum, but only at its ceiling',
    editorialThesis:
        'A range ceiling is a boundary to investigate, not an expected offer',
    readerValue:
        'Readers can decide what to verify before investing in an application',
    evidenceRole: 'illustrate',
};
const plan: FollowerGrowthPlan = {
    ...concept,
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
        (openaiReviewFollowerGrowthPosts as jest.Mock).mockImplementation(
            async ({ draft }: { draft: typeof generatedPosts }) => draft,
        );
        (openaiPlanFollowerGrowthConcept as jest.Mock).mockResolvedValue(
            concept,
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
        expect(openaiPlanFollowerGrowthConcept).toHaveBeenCalledWith(
            expect.objectContaining({
                requestedFamily: 'salaryIntelligence',
                topic: 'Backend salaries',
                history: [],
            }),
        );
        expect(openaiPlanFollowerGrowthContent).toHaveBeenCalledWith(
            expect.objectContaining({ concept }),
        );
        expect(openaiCreateFollowerGrowthPosts).toHaveBeenCalledWith(
            expect.objectContaining({
                plan,
                history: [],
                dataset: expect.objectContaining({
                    editorialThesis: plan.editorialThesis,
                    evidence: expect.any(Array),
                }),
            }),
        );
        expect(openaiReviewFollowerGrowthPosts).toHaveBeenCalledWith(
            expect.objectContaining({
                plan,
                draft: generatedPosts,
                dataset: expect.objectContaining({
                    editorialThesis: plan.editorialThesis,
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

    it('returns and records the reviewed package', async () => {
        const reviewedPosts = {
            ...generatedPosts,
            summary: 'Reviewed backend salary comparison.',
        };
        (openaiReviewFollowerGrowthPosts as jest.Mock).mockResolvedValue(
            reviewedPosts,
        );

        await expect(
            generateFollowerGrowthPosts({ family: 'salaryIntelligence' }),
        ).resolves.toEqual(reviewedPosts);
        expect(followerGrowthContentRepository.add).toHaveBeenCalledWith(
            expect.objectContaining({ summary: reviewedPosts.summary }),
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
        expect(openaiReviewFollowerGrowthPosts).toHaveBeenCalledTimes(1);
        expect(openaiReviewFollowerGrowthPosts).toHaveBeenCalledWith(
            expect.objectContaining({ draft: freshPosts }),
        );
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
        expect(openaiReviewFollowerGrowthPosts).not.toHaveBeenCalled();
        expect(followerGrowthContentRepository.add).not.toHaveBeenCalled();
    });

    it('does not persist when the review repeats an existing topic', async () => {
        (followerGrowthContentRepository.getAll as jest.Mock).mockResolvedValue(
            [
                {
                    id: 'history-1',
                    generatedAt: 1000,
                    family: 'salaryIntelligence',
                    topicKey: 'reviewed-repeat',
                    summary: 'Already used.',
                },
            ],
        );
        (openaiReviewFollowerGrowthPosts as jest.Mock).mockResolvedValue({
            ...generatedPosts,
            topicKey: 'reviewed-repeat',
        });

        await expect(
            generateFollowerGrowthPosts({ family: 'salaryIntelligence' }),
        ).rejects.toThrow('repeated an existing follower-growth topic');
        expect(followerGrowthContentRepository.add).not.toHaveBeenCalled();
    });

    it('re-plans once when requested data is unavailable', async () => {
        const unavailablePlan: FollowerGrowthPlan = {
            ...concept,
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
                    expect.stringContaining('No sufficient data'),
                ]),
            }),
        );
    });

    it('replaces a concept that the inventory cannot support', async () => {
        const unsupportedConcept: FollowerGrowthConcept = {
            ...concept,
            editorialThesis:
                'Long requirement lists should always be treated as optional',
        };
        (openaiPlanFollowerGrowthConcept as jest.Mock)
            .mockResolvedValueOnce(unsupportedConcept)
            .mockResolvedValueOnce(concept);
        (openaiPlanFollowerGrowthContent as jest.Mock)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(plan);

        await expect(
            generateFollowerGrowthPosts({ family: 'salaryIntelligence' }),
        ).resolves.toEqual(generatedPosts);

        expect(openaiPlanFollowerGrowthConcept).toHaveBeenCalledTimes(2);
        expect(openaiPlanFollowerGrowthConcept).toHaveBeenLastCalledWith(
            expect.objectContaining({
                excludedConcepts: [
                    `${unsupportedConcept.readerProblem} — ${unsupportedConcept.editorialThesis}`,
                ],
            }),
        );
        expect(openaiCreateFollowerGrowthPosts).toHaveBeenCalledTimes(1);
    });
});
