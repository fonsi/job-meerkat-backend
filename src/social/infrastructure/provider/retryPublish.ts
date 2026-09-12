const RETRIABLE_HTTP_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const RETRIABLE_THREADS_CODES = new Set([2]);
const RETRIABLE_NETWORK_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_SOCKET',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
]);

export const PUBLISH_RETRY_DELAYS_MS = [1000, 3000];

type ThreadsApiError = {
    is_transient?: boolean;
    code?: number;
};

export type PublishError = Error & {
    status?: number;
    threadsError?: ThreadsApiError;
    code?: string;
    cause?: { code?: string };
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const parseThreadsApiError = (
    text: string,
): ThreadsApiError | undefined => {
    const jsonStart = text.indexOf('{');
    if (jsonStart < 0) return undefined;
    try {
        const parsed = JSON.parse(text.slice(jsonStart)) as {
            error?: ThreadsApiError;
        } & ThreadsApiError;
        if (parsed.error && typeof parsed.error === 'object') {
            return parsed.error;
        }
        if (
            typeof parsed.is_transient === 'boolean' ||
            typeof parsed.code === 'number'
        ) {
            return parsed;
        }

        return undefined;
    } catch {
        return undefined;
    }
};

export const threadsResponseError = (
    prefix: string,
    status: number,
    body: string,
): PublishError => {
    const error = new Error(`${prefix} ${body}`) as PublishError;
    error.status = status;
    error.threadsError = parseThreadsApiError(body);

    return error;
};

const getStatus = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || !error) return undefined;
    const status = (error as PublishError).status;

    return typeof status === 'number' ? status : undefined;
};

const getThreadsError = (error: unknown): ThreadsApiError | undefined => {
    if (typeof error === 'object' && error && 'threadsError' in error) {
        return (error as PublishError).threadsError;
    }
    if (error instanceof Error) return parseThreadsApiError(error.message);

    return undefined;
};

export const isRetriablePublishError = (error: unknown): boolean => {
    const threadsError = getThreadsError(error);
    if (threadsError?.is_transient === true) return true;
    if (
        typeof threadsError?.code === 'number' &&
        RETRIABLE_THREADS_CODES.has(threadsError.code)
    ) {
        return true;
    }

    const status = getStatus(error);
    if (status != null) return RETRIABLE_HTTP_STATUSES.has(status);

    if (typeof error === 'object' && error) {
        const withCode = error as PublishError;
        const code = withCode.code || withCode.cause?.code;
        if (code && RETRIABLE_NETWORK_CODES.has(code)) return true;
    }

    if (error instanceof TypeError && /fetch failed/i.test(error.message)) {
        return true;
    }

    return (
        error instanceof Error &&
        /ECONNRESET|ETIMEDOUT|ECONNREFUSED/i.test(error.message)
    );
};

export const withRetry = async <T>(
    fn: () => Promise<T>,
    isRetriable: (error: unknown) => boolean = isRetriablePublishError,
    delaysMs: number[] = PUBLISH_RETRY_DELAYS_MS,
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (delaysMs.length === 0 || !isRetriable(error)) throw error;
        const [delayMs, ...remainingDelaysMs] = delaysMs;
        await sleep(delayMs);

        return withRetry(fn, isRetriable, remainingDelaysMs);
    }
};
