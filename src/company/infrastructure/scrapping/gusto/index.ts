import { fromURL } from 'cheerio';
import {
    ListedJobPostsData,
    NewCompanyScrapper,
    ScrappedJobPost,
} from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const GUSTO_NAME = 'gusto';
const GUSTO_NAME_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/gusto/jobs?content=true';

type ScrapJobPostData = {
    id: string;
    url: string;
};

const JOB_HEADER_SELECTOR = '.job__header';
const JOB_CONTENT_SELECTOR = '.job__description';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);
        const jobPostHeader = $(JOB_HEADER_SELECTOR).text();
        const jobPostContent = $(JOB_CONTENT_SELECTOR).text();

        return openaiJobPostAnalyzer(`${jobPostHeader} ${jobPostContent}`);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${GUSTO_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const gustoScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(GUSTO_NAME_INITIAL_URL);
            const jobsData = await response.json();

            return jobsData.jobs.map((jobData) => ({
                id: jobData.id.toString(),
                url: jobData.absolute_url,
                title: jobData.title,
                createdAt: new Date(jobData.updated_at).getTime(),
            }));
        },

        scrapJobPost: async (jobPosts: ListedJobPostsData[]) => {
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
                        `[Error processing ${GUSTO_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
