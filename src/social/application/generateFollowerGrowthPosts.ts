import { Company } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { JobPost, JobPostDetails } from 'jobPost/domain/jobPost';
import { jobPostDetailsRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostDetailsRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { openaiCreateFollowerGrowthPosts } from 'shared/infrastructure/ai/openai/openaiCreateFollowerGrowthPosts';
import { openaiPlanFollowerGrowthConcept } from 'shared/infrastructure/ai/openai/openaiPlanFollowerGrowthConcept';
import { openaiPlanFollowerGrowthContent } from 'shared/infrastructure/ai/openai/openaiPlanFollowerGrowthContent';
import { openaiReviewFollowerGrowthPosts } from 'shared/infrastructure/ai/openai/openaiReviewFollowerGrowthPosts';
import { FollowerGrowthPosts } from 'shared/infrastructure/ai/openai/followerGrowthPosts';
import {
    createFollowerGrowthContent,
    FOLLOWER_GROWTH_FAMILIES,
    FollowerGrowthContent,
    FollowerGrowthFamily,
    isFollowerGrowthFamily,
} from 'social/domain/followerGrowthContent';
import { FollowerGrowthPlan } from 'social/domain/followerGrowthPlan';
import { followerGrowthContentRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbFollowerGrowthContentRepository';
import {
    buildFollowerGrowthInventory,
    FollowerGrowthDataset,
    followerGrowthDataIsComplete,
    resolveFollowerGrowthData,
    selectFollowerGrowthPlanDetailJobs,
} from './followerGrowthDataResolver';

export type GenerateFollowerGrowthPostsInput = {
    family?: unknown;
    topic?: unknown;
};

const MAX_CONCEPT_ATTEMPTS = 3;
const MAX_EVIDENCE_PLAN_ATTEMPTS = 3;

const parseFamily = (
    requestedFamily: unknown,
): FollowerGrowthFamily | undefined => {
    if (requestedFamily == null || requestedFamily === '') return undefined;
    if (!isFollowerGrowthFamily(requestedFamily)) {
        throw new Error(
            `family must be one of: ${FOLLOWER_GROWTH_FAMILIES.join(', ')}`,
        );
    }

    return requestedFamily;
};

const parseTopic = (topic: unknown): string | undefined => {
    if (topic == null || topic === '') return undefined;
    if (typeof topic !== 'string') throw new Error('topic must be a string');
    const trimmed = topic.trim();
    if (!trimmed) return undefined;
    if (trimmed.length > 500) {
        throw new Error('topic must not exceed 500 characters');
    }

    return trimmed;
};

const loadDetails = async (
    plan: FollowerGrowthPlan,
    jobPosts: JobPost[],
    companies: Company[],
    existing: Map<JobPost['id'], JobPostDetails> = new Map(),
): Promise<Map<JobPost['id'], JobPostDetails>> => {
    const selectedJobs = selectFollowerGrowthPlanDetailJobs({
        plan,
        jobPosts,
        companies,
    }).filter((jobPost) => !existing.has(jobPost.id));
    const entries = await Promise.all(
        selectedJobs.map(async (jobPost) => {
            const details = await jobPostDetailsRepository.getByJobPostId(
                jobPost.id,
            );

            return details ? ([jobPost.id, details] as const) : null;
        }),
    );

    return new Map([...existing, ...entries.filter((entry) => entry != null)]);
};

const isRepeatedTopic = (
    posts: FollowerGrowthPosts,
    history: FollowerGrowthContent[],
): boolean => history.some((item) => item.topicKey === posts.topicKey);

export const generateFollowerGrowthPosts = async ({
    family: requestedFamily,
    topic: requestedTopic,
}: GenerateFollowerGrowthPostsInput = {}): Promise<FollowerGrowthPosts> => {
    const [jobPosts, companies, history] = await Promise.all([
        jobPostRepository.getAllOpen(),
        companyRepository.getAll(),
        followerGrowthContentRepository.getAll(),
    ]);
    const family = parseFamily(requestedFamily);
    const topic = parseTopic(requestedTopic);
    const inventory = buildFollowerGrowthInventory({
        jobPosts,
        companies,
    });
    const excludedConcepts: string[] = [];
    let detailsByJobPostId = new Map<JobPost['id'], JobPostDetails>();
    let plan: FollowerGrowthPlan | undefined;
    let dataset: FollowerGrowthDataset | undefined;
    for (
        let conceptAttempt = 0;
        conceptAttempt < MAX_CONCEPT_ATTEMPTS && !plan;
        conceptAttempt += 1
    ) {
        const concept = await openaiPlanFollowerGrowthConcept({
            requestedFamily: family,
            topic,
            history,
            excludedConcepts,
        });
        let availabilityFeedback: string[] = [];
        for (
            let evidenceAttempt = 0;
            evidenceAttempt < MAX_EVIDENCE_PLAN_ATTEMPTS;
            evidenceAttempt += 1
        ) {
            const candidatePlan = await openaiPlanFollowerGrowthContent({
                concept,
                inventory,
                availabilityFeedback,
            });
            if (!candidatePlan) break;

            detailsByJobPostId = await loadDetails(
                candidatePlan,
                jobPosts,
                companies,
                detailsByJobPostId,
            );
            const candidateDataset = resolveFollowerGrowthData({
                plan: candidatePlan,
                jobPosts,
                companies,
                detailsByJobPostId,
            });
            if (followerGrowthDataIsComplete(candidateDataset)) {
                plan = candidatePlan;
                dataset = candidateDataset;
                break;
            }
            availabilityFeedback = candidateDataset.availability
                .filter(({ status }) => status === 'unavailable')
                .map(({ message }) => message);
        }
        if (!plan) {
            excludedConcepts.push(
                `${concept.readerProblem} — ${concept.editorialThesis}`,
            );
        }
    }
    if (!plan || !dataset) {
        throw new Error(
            'No broad follower-growth concept could be supported by the available evidence',
        );
    }

    let posts = await openaiCreateFollowerGrowthPosts({
        plan,
        dataset,
        history,
    });

    if (isRepeatedTopic(posts, history)) {
        posts = await openaiCreateFollowerGrowthPosts({
            plan,
            dataset,
            history,
            excludedTopicKeys: [posts.topicKey],
        });
    }
    if (isRepeatedTopic(posts, history)) {
        throw new Error(
            `OpenAI repeated an existing follower-growth topic: ${posts.topicKey}`,
        );
    }

    posts = await openaiReviewFollowerGrowthPosts({
        plan,
        dataset,
        draft: posts,
    });
    if (isRepeatedTopic(posts, history)) {
        throw new Error(
            `OpenAI repeated an existing follower-growth topic: ${posts.topicKey}`,
        );
    }

    await followerGrowthContentRepository.add(
        createFollowerGrowthContent({
            family: posts.family,
            topicKey: posts.topicKey,
            summary: posts.summary,
        }),
    );

    return posts;
};
