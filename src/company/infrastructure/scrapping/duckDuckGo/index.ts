import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { logger } from 'shared/infrastructure/logger/logger';

export const DUCK_DUCK_GO_NAME = 'duckduckgo';
const DUCK_DUCK_GO_INITIAL_URL = 'https://duckduckgo.com/jobs.js';

type ScrapJobPostData = {
    id: string;
    data: Record<string, unknown>;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
    createdAt: number;
    data: Record<string, unknown>;
};

const scrapJobPost = async ({
    id,
    data,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        return openaiJobPostAnalyzer(JSON.stringify(data));
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${DUCK_DUCK_GO_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const duckDuckGoScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(DUCK_DUCK_GO_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = [];

    jobsData.jobs.forEach((jobData) => {
        const url = jobData.jobUrl;
        const isListed = jobData.isListed;

        if (isListed) {
            jobPosts.push({
                id: jobData.id,
                url,
                title: jobData.title,
                createdAt: new Date(jobData.publishedAt).getTime(),
                data: jobData,
            });
        }
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
                data: jobPost.data,
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
                `[Error processing ${DUCK_DUCK_GO_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
