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

export const RETOOL_NAME = 'retool';
const RETOOL_INITIAL_URL =
    'https://api.greenhouse.io/v1/boards/retool/jobs?content=true';

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
            `Error processing ${RETOOL_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const retoolScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(RETOOL_INITIAL_URL);
            const jobsData = await response.json();

            const jobPosts: ListedJobPostsData[] = jobsData.jobs.map(
                (jobData) => {
                    const url = jobData.absolute_url;

                    return {
                        id: jobData.id.toString(),
                        url,
                        title: jobData.title,
                        createdAt: new Date(jobData.updated_at).getTime(),
                    };
                },
            );

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
                        `Error processing ${RETOOL_NAME}`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
