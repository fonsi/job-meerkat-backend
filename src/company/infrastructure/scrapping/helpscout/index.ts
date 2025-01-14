import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const HELPSCOUT_NAME = 'helpscout';
const HELPSCOUT_INITIAL_URL = 'https://www.helpscout.com/company/careers/';

type ScrapJobPostData = {
    id: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
};

const JOB_POST_SELECTOR = '.items a[href*="helpscout.com/company/careers"]';
const JOB_CONTENT_SELECTOR = '#Content';

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
            `Error processing ${HELPSCOUT_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const helpscoutScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const $ = await fromURL(HELPSCOUT_INITIAL_URL);
    const jobPostsElements = $(JOB_POST_SELECTOR);

    const jobPosts: JobPostsListItem[] = jobPostsElements
        .toArray()
        .map((jobPost) => {
            const url = $(jobPost).attr('href');
            const urlObject = new URL(url);

            return {
                id: urlObject.pathname.split('/').filter(Boolean).pop(),
                url,
                title: $('h6', jobPost).text(),
            };
        })
        .filter((jobPost) => !jobPost.title.includes('Future openings'));

    const data: ScrappedJobPost[] = [];
    for (let i = 0; i < jobPosts.length; i++) {
        try {
            const jobPost = jobPosts[i];
            console.log(
                `Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`,
            );

            const jobPostData = await scrapJobPost({
                id: jobPost.id,
                url: jobPost.url,
            });

            data.push({
                ...jobPostData,
                originalId: jobPost.id,
                url: jobPost.url,
                title: jobPost.title,
                companyId,
            });
        } catch (e) {
            const error = errorWithPrefix(
                e,
                `[Error processing ${HELPSCOUT_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
