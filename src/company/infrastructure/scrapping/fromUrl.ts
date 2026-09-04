import { fromURL as cheerioFromURL } from 'cheerio';
import { isRetriableHttpError, withRetry } from './retryHttp';

export const fromURL: typeof cheerioFromURL = (url, options) =>
    withRetry(() => cheerioFromURL(url, options), isRetriableHttpError);
