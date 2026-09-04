import { JobListingUnavailableError } from './jobListingUnavailableError';

const RETRIABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const RETRIABLE_NETWORK_CODES = new Set([
    'ECONNRESET',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'UND_ERR_CONNECT_TIMEOUT',
    'UND_ERR_SOCKET',
    'UND_ERR_HEADERS_TIMEOUT',
    'UND_ERR_BODY_TIMEOUT',
]);

export const errorFromHttpResponse = (response: Response): Error => {
    const error = new Error(`Response status code ${response.status}`);
    (error as Error & { status: number }).status = response.status;

    return error;
};

export const throwIfUnsuccessfulResponse = (response: Response): void => {
    if (response.ok) return;
    throw errorFromHttpResponse(response);
};

export const DEFAULT_RETRY_DELAYS_MS = [250, 750];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getErrorStatus = (error: unknown): number | undefined => {
    if (error instanceof JobListingUnavailableError) return error.status;
    if (typeof error === 'object' && error && 'status' in error) {
        const status = (error as { status?: unknown }).status;
        if (typeof status === 'number') return status;
    }
    if (!(error instanceof Error)) return undefined;
    const match = /status code (\d{3})/i.exec(error.message);

    return match ? Number(match[1]) : undefined;
};

const getErrorCode = (error: unknown): string | undefined => {
    if (typeof error !== 'object' || !error) return undefined;
    const withCode = error as { code?: string; cause?: { code?: string } };

    return withCode.code || withCode.cause?.code;
};

export const isRetriableHttpError = (error: unknown): boolean => {
    const status = getErrorStatus(error);
    if (status != null) return RETRIABLE_STATUSES.has(status);

    const code = getErrorCode(error);
    if (code && RETRIABLE_NETWORK_CODES.has(code)) return true;
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
    isRetriable: (error: unknown) => boolean = isRetriableHttpError,
    delaysMs: number[] = DEFAULT_RETRY_DELAYS_MS,
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
