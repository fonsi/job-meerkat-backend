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

export const INVISIBLE_NAME = 'invisible';
const INVISIBLE_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/invisibletech/departments';

type ScrapJobPostData = {
    id: number;
    url: string;
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
            `Error processing ${INVISIBLE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const invisibleScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(INVISIBLE_INITIAL_URL);
            const jobsData = await response.json();

            const jobPosts: ListedJobPostsData[] = [];

            jobsData.departments.forEach((department) => {
                department.jobs.forEach((jobData) => {
                    const url = jobData.absolute_url;

                    jobPosts.push({
                        id: jobData.id.toString(),
                        url,
                        title: jobData.title,
                        createdAt: new Date(jobData.updated_at).getTime(),
                    });
                });
            });

            return jobPosts;
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
                        id: parseInt(jobPost.id),
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
                        `[Error processing ${INVISIBLE_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
