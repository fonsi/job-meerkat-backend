import { JobListingUnavailableError } from './jobListingUnavailableError';
import { isRetriableHttpError, withRetry } from './retryHttp';

const statusError = (status: number) => {
    const error = new Error(`Response status code ${status}: Fail`);
    (error as Error & { status: number }).status = status;

    return error;
};

describe('isRetriableHttpError', () => {
    it('retries 502, 503, and 429', () => {
        expect(isRetriableHttpError(statusError(502))).toBe(true);
        expect(isRetriableHttpError(statusError(503))).toBe(true);
        expect(isRetriableHttpError(statusError(429))).toBe(true);
    });

    it('does not retry 404 or 403', () => {
        expect(isRetriableHttpError(statusError(404))).toBe(false);
        expect(isRetriableHttpError(statusError(403))).toBe(false);
        expect(
            isRetriableHttpError(
                new JobListingUnavailableError('acme', 'https://x', 404),
            ),
        ).toBe(false);
    });

    it('retries listing-unavailable 502s', () => {
        expect(
            isRetriableHttpError(
                new JobListingUnavailableError('acme', 'https://x', 502),
            ),
        ).toBe(true);
    });

    it('retries network failures', () => {
        expect(isRetriableHttpError(new TypeError('fetch failed'))).toBe(true);
        const timedOut = new Error('connect');
        (timedOut as Error & { code: string }).code = 'ETIMEDOUT';
        expect(isRetriableHttpError(timedOut)).toBe(true);
    });
});

describe('withRetry', () => {
    it('returns on first success', async () => {
        const fn = jest.fn().mockResolvedValue('ok');

        await expect(withRetry(fn, isRetriableHttpError, [0, 0])).resolves.toBe(
            'ok',
        );
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries a 502 then succeeds', async () => {
        const fn = jest
            .fn()
            .mockRejectedValueOnce(statusError(502))
            .mockResolvedValueOnce('ok');

        await expect(withRetry(fn, isRetriableHttpError, [0])).resolves.toBe(
            'ok',
        );
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry a 404', async () => {
        const error = statusError(404);
        const fn = jest.fn().mockRejectedValue(error);

        await expect(withRetry(fn, isRetriableHttpError, [0, 0])).rejects.toBe(
            error,
        );
        expect(fn).toHaveBeenCalledTimes(1);
    });

    it('gives up after the retry budget', async () => {
        const error = statusError(503);
        const fn = jest.fn().mockRejectedValue(error);

        await expect(withRetry(fn, isRetriableHttpError, [0, 0])).rejects.toBe(
            error,
        );
        expect(fn).toHaveBeenCalledTimes(3);
    });
});
