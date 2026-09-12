import {
    isRetriablePublishError,
    parseThreadsApiError,
    threadsResponseError,
    withRetry,
} from './retryPublish';

const transientBody =
    '{"error":{"message":"An unexpected error has occurred. Please retry your request later.","type":"OAuthException","is_transient":true,"code":2,"fbtrace_id":"AARJAGNjssvGkCTDKtcGLF4"}}';

describe('parseThreadsApiError', () => {
    it('reads the nested Graph error from a prefixed message', () => {
        expect(
            parseThreadsApiError(`Error publishing thread: ${transientBody}`),
        ).toEqual({
            message:
                'An unexpected error has occurred. Please retry your request later.',
            type: 'OAuthException',
            is_transient: true,
            code: 2,
            fbtrace_id: 'AARJAGNjssvGkCTDKtcGLF4',
        });
    });
});

describe('isRetriablePublishError', () => {
    it('retries Meta transient code 2 even when HTTP status is 400', () => {
        const error = threadsResponseError(
            'Error publishing thread:',
            400,
            transientBody,
        );
        expect(isRetriablePublishError(error)).toBe(true);
        expect(
            isRetriablePublishError(
                new Error(`Error publishing thread: ${transientBody}`),
            ),
        ).toBe(true);
    });

    it('does not retry validation or expired-token errors', () => {
        expect(
            isRetriablePublishError(
                threadsResponseError(
                    'Error creating thread:',
                    400,
                    '{"error":{"message":"Param text must be at most 500 characters long.","type":"THApiException","code":100}}',
                ),
            ),
        ).toBe(false);
        expect(
            isRetriablePublishError(
                threadsResponseError(
                    'Error creating thread:',
                    400,
                    '{"error":{"message":"Error validating access token: Session has expired","type":"OAuthException","code":190}}',
                ),
            ),
        ).toBe(false);
    });

    it('retries 429/5xx, network failures, and Bluesky XRPC 5xx', () => {
        expect(
            isRetriablePublishError(
                threadsResponseError('Error publishing thread:', 503, '{}'),
            ),
        ).toBe(true);
        expect(isRetriablePublishError(new TypeError('fetch failed'))).toBe(
            true,
        );
        const xrpc = new Error('Service Unavailable') as Error & {
            status: number;
        };
        xrpc.status = 502;
        expect(isRetriablePublishError(xrpc)).toBe(true);
    });

    it('does not retry Bluesky grapheme validation', () => {
        const error = new Error(
            'Invalid app.bsky.feed.post record: grapheme too big (maximum 300, got 306) at $.record.text',
        ) as Error & { status: number };
        error.status = 400;
        expect(isRetriablePublishError(error)).toBe(false);
    });
});

describe('withRetry', () => {
    it('retries a transient error then succeeds', async () => {
        const error = threadsResponseError(
            'Error publishing thread:',
            400,
            transientBody,
        );
        const fn = jest
            .fn()
            .mockRejectedValueOnce(error)
            .mockResolvedValueOnce('ok');

        await expect(withRetry(fn, isRetriablePublishError, [0])).resolves.toBe(
            'ok',
        );
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry a 500-character validation error', async () => {
        const error = threadsResponseError(
            'Error creating thread:',
            400,
            '{"error":{"code":100}}',
        );
        const fn = jest.fn().mockRejectedValue(error);

        await expect(
            withRetry(fn, isRetriablePublishError, [0, 0]),
        ).rejects.toBe(error);
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
