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
    'https://boards-api.greenhouse.io/v1/boards/happymoney/departments';

type ScrapJobPostData = {
    id: number;
    url: string;
};

type JobPostsListItem = {
    id: number;
    url: string;
    title: string;
    createdAt: number;
};

const JOB_TITLE_SELECTOR = '.job__title';
const JOB_DESCRIPTION_SELECTOR = '.job__description';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const jobPostTitle = $(JOB_TITLE_SELECTOR).text();
        const jobPostDescription = $(JOB_DESCRIPTION_SELECTOR).text();

        return openaiJobPostAnalyzer(`${jobPostTitle} ${jobPostDescription}`);
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

    const jobPosts: JobPostsListItem[] = [];

    jobsData.departments.forEach((department) => {
        department.jobs.forEach((jobData) => {
            const url = jobData.absolute_url;
            const title = jobData.title;

            if (title.toLowerCase().includes('general application')) {
                return;
            }

            jobPosts.push({
                id: jobData.id,
                url,
                title,
                createdAt: new Date(jobData.updated_at).getTime(),
            });
        });
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
                originalId: jobPost.id.toString(),
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
