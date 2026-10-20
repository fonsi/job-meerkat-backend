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

const normalizeStringField = (value: unknown): string | undefined => {
    if (value == null) return undefined;

    if (Array.isArray(value)) {
        const joined = value
            .map((item) => (item == null ? '' : String(item).trim()))
            .filter(Boolean)
            .join(', ');

        return joined || undefined;
    }

    if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
    ) {
        const normalized = String(value).trim();

        return normalized || undefined;
    }

    return undefined;
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
    const raw = parsed as Record<string, unknown>;
    const title = normalizeStringField(raw.title);
    const location = normalizeStringField(raw.location);

    return {
        ...jobPost,
        ...('title' in raw ? { title: title as string } : {}),
        ...('location' in raw ? { location: location as string } : {}),
        details: normalizeJobPostDetails(jobPost.details),
    };
};
