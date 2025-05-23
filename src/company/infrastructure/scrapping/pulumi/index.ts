import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const PULUMI_NAME = 'pulumi';
const PULUMI_INITIAL_URL = 'https://boards.greenhouse.io/pulumicorporation';

type ScrapJobPostData = {
    id: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
};

const JOB_POST_SELECTOR = '.job-post a';
const JOB_HEADER_SELECTOR = '.job__title h1';
const JOB_CONTENT_SELECTOR = '.job__description';
const JOB_LOCATION_SELECTOR = '.job__location';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const titleText = $(JOB_HEADER_SELECTOR).text();
        const descriptionText = $(JOB_CONTENT_SELECTOR).text();
        const locationText = $(JOB_LOCATION_SELECTOR).text();
        const jobPostContent = `Location: ${locationText}\n${titleText}\n${descriptionText}`;

        return openaiJobPostAnalyzer(jobPostContent);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${PULUMI_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const pulumiScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const $ = await fromURL(PULUMI_INITIAL_URL);
    const jobPostsElements = $(JOB_POST_SELECTOR);

    const jobPosts: JobPostsListItem[] = jobPostsElements
        .toArray()
        .map((jobPost) => {
            const url = $(jobPost).attr('href');

            return {
                id: url.split('/').pop(),
                url,
                title: $('p', jobPost).first().text(),
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
            });
        } catch (e) {
            const error = errorWithPrefix(
                e,
                `[Error processing ${PULUMI_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
