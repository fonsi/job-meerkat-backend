import { fetchJobListingJson } from './fetchJobListingJson';
import { JobListingUnavailableError } from './jobListingUnavailableError';

const jsonResponse = (status: number, body: unknown, ok = status < 400) =>
    ({
        ok,
        status,
        headers: { get: () => 'application/json' },
        text: async () => JSON.stringify(body),
    }) as unknown as Response;

describe('fetchJobListingJson', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('returns parsed JSON on success', async () => {
        global.fetch = jest
            .fn()
            .mockResolvedValue(jsonResponse(200, { jobs: [] }));

        await expect(
            fetchJobListingJson({
                companyName: 'acme',
                url: 'https://example.com/jobs',
            }),
        ).resolves.toEqual({ jobs: [] });
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('does not retry a 404', async () => {
        global.fetch = jest
            .fn()
            .mockResolvedValue(jsonResponse(404, {}, false));

        await expect(
            fetchJobListingJson({
                companyName: 'acme',
                url: 'https://example.com/jobs',
            }),
        ).rejects.toBeInstanceOf(JobListingUnavailableError);
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });
});
