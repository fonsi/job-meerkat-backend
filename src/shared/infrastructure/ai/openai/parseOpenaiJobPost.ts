import { JobPost, normalizeJobPostDetails } from 'jobPost/domain/jobPost';

export type OpenaiJobPost = Omit<
    JobPost,
    | 'id'
    | 'originalId'
    | 'companyId'
    | 'url'
    | 'createdAt'
    | 'closedAt'
    | 'slug'
> & {
    createdAt?: number | null;
};

export const parseOpenaiJobPost = (
    content: string | null | undefined,
): OpenaiJobPost => {
    if (!content) throw new Error('Empty OpenAI job post response');

    const parsed = JSON.parse(content) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Invalid OpenAI job post response');
    }

    const jobPost = parsed as OpenaiJobPost;

    return {
        ...jobPost,
        details: normalizeJobPostDetails(jobPost.details),
    };
};
