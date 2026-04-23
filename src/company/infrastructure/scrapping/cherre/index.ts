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

export const CHERRE_NAME = 'cherre';
const CHERRE_INITIAL_URL = 'https://api.lever.co/v0/postings/cherre?mode=json';

type ScrapJobPostData = {
    id: string;
    url: string;
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
            `Error processing ${CHERRE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const cherreScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(CHERRE_INITIAL_URL);
            const jobsData = await response.json();

            const jobPosts: ListedJobPostsData[] = jobsData.map((jobData) => {
                const url = jobData.hostedUrl;

                return {
                    id: jobData.id,
                    url,
                    title: jobData.text,
                    createdAt: jobData.createdAt,
                };
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
                        `[Error processing ${CHERRE_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
