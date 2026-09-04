import { JobListingUnavailableError } from './jobListingUnavailableError';
import { isRetriableHttpError, withRetry } from './retryHttp';

type FetchJobListingJsonOptions = {
    companyName: string;
    url: string;
    init?: RequestInit;
};

export const fetchJobListingJson = async <T>({
    companyName,
    url,
    init,
}: FetchJobListingJsonOptions): Promise<T> => {
    return withRetry(async () => {
        const response = await fetch(url, init);

        if (!response.ok) {
            throw new JobListingUnavailableError(
                companyName,
                url,
                response.status,
            );
        }

        const contentType = response.headers.get('content-type') || '';
        const body = await response.text();

        if (!body || body.trim().toLowerCase() === 'not found') {
            throw new JobListingUnavailableError(
                companyName,
                url,
                response.status,
            );
        }

        try {
            return JSON.parse(body) as T;
        } catch {
            if (!contentType.includes('application/json')) {
                throw new JobListingUnavailableError(
                    companyName,
                    url,
                    response.status,
                );
            }

            throw new JobListingUnavailableError(companyName, url);
        }
    }, isRetriableHttpError);
};
