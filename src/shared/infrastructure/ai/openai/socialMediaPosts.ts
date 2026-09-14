export type SocialMediaPosts = {
    bluesky: string[];
    threads: string[];
};

export const cleanUrlsInObject = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
        return obj.replace(/(https?:\/\/[^\s]+)\.(?=[\s"}]|$)/g, '$1');
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => cleanUrlsInObject(item));
    }
    if (typeof obj === 'object' && obj !== null) {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            cleaned[key] = cleanUrlsInObject(value);
        }
        return cleaned;
    }
    return obj;
};

const toPostList = (value: unknown): string[] => {
    if (typeof value === 'string') return [value];
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
};

export const parseSocialMediaPosts = (
    rawContent: string | null | undefined,
): SocialMediaPosts => {
    if (!rawContent) {
        throw new Error('OpenAI social posts response was empty');
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(rawContent);
    } catch {
        throw new Error(
            `OpenAI social posts response was not JSON: ${rawContent}`,
        );
    }

    const cleaned = cleanUrlsInObject(parsed);
    if (!cleaned || typeof cleaned !== 'object' || Array.isArray(cleaned)) {
        throw new Error(
            `OpenAI social posts JSON was not an object: ${rawContent}`,
        );
    }

    const record = cleaned as Record<string, unknown>;
    const posts: SocialMediaPosts = {
        bluesky: toPostList(record.bluesky),
        threads: toPostList(record.threads),
    };

    if (posts.bluesky.length === 0 && posts.threads.length === 0) {
        throw new Error(
            `OpenAI social posts missing bluesky/threads arrays: ${rawContent}`,
        );
    }

    return posts;
};
