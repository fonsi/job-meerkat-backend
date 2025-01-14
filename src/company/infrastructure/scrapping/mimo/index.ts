import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { hash } from 'node:crypto';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const MIMO_NAME = 'mimo';
const MIMO_INITIAL_URL = 'https://jobs.mimo.org';

type ScrapJobPostData = {
    id: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
};

const JOB_POST_SELECTOR = 'a[href*="/o/"]';
const JOB_CONTENT_SELECTOR = '[role=tabpanel]:not([hidden])';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const jobPostContent = $(JOB_CONTENT_SELECTOR).text();

        return openaiJobPostAnalyzer(jobPostContent);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${MIMO_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const mimoScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const $ = await fromURL(MIMO_INITIAL_URL);
    const jobPostsElements = $(JOB_POST_SELECTOR);

    // we don't have a good selector for the job offer links so we select all the job offer like links
    // and add to a Set to avoid duplicates
    const jobPostsUrls = new Set<string>();

    jobPostsElements.toArray().map((jobPost) => {
        const url = $(jobPost).attr('href');

        jobPostsUrls.add(`${MIMO_INITIAL_URL}${url}`);
    });

    const jobPosts: JobPostsListItem[] = [];

    jobPostsUrls.forEach((url) => {
        const id = hash('md5', url); // hash generated from the url because there isn't any job post id

        jobPosts.push({
            id,
            url,
        });
    });

    const data: ScrappedJobPost[] = [];
    for (let i = 0; i < jobPosts.length; i++) {
        try {
            const jobPost = jobPosts[i];
            console.log(
                `Analyzing: "${jobPost.url}" (${i + 1} / ${jobPosts.length})`,
            );

            const jobPostData = await scrapJobPost({
                id: jobPost.id,
                url: jobPost.url,
            });

            data.push({
                ...jobPostData,
                originalId: jobPost.id,
                url: jobPost.url,
                companyId,
            });
        } catch (e) {
            const error = errorWithPrefix(e, `[Error processing ${MIMO_NAME}]`);

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
