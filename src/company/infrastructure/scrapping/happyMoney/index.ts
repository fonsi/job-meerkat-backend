import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const HAPPY_MONEY_NAME = 'happy money';
const HAPPY_MONEY_INITIAL_URL =
    'https://api.lever.co/v0/postings/happymoney?mode=json';

type ScrapJobPostData = {
    id: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
    createdAt: number;
};

const JOB_CONTENT_SELECTOR = '.content';

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
            `Error processing ${HAPPY_MONEY_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const happyMoneyScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(HAPPY_MONEY_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = jobsData.map((jobData) => {
        const url = jobData.hostedUrl;

        return {
            id: jobData.id,
            url,
            title: jobData.text,
            createdAt: jobData.createdAt,
        };
    });

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
                companyId,
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            const error = errorWithPrefix(
                e,
                `[Error processing ${HAPPY_MONEY_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
