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

export const AXIOS_HQ_NAME = 'axios hq';
const AXIOS_HQ_INITIAL_URL = 'https://axioshq.careers-page.com';

type ScrapJobPostData = {
    id: string;
    url: string;
};

const JOB_POST_SELECTOR = '.job-card a.job-title-link';
const JOB_TITLE_SELECTOR = '.single-job-title';
const JOB_DESCRIPTION_SELECTOR = '.single-job-content';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const titleText = $(JOB_TITLE_SELECTOR).text();
        const descriptionText = $(JOB_DESCRIPTION_SELECTOR).text();
        const jobPostContent = `${titleText} ${descriptionText}`;

        return openaiJobPostAnalyzer(jobPostContent);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${AXIOS_HQ_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const axiosHqScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const $ = await fromURL(AXIOS_HQ_INITIAL_URL);
            const jobPostsElements = $(JOB_POST_SELECTOR);

            const jobPosts: ListedJobPostsData[] = jobPostsElements
                .toArray()
                .map((jobPost) => {
                    const url = `${AXIOS_HQ_INITIAL_URL}${$(jobPost).attr('href')}`;
                    const id = $(jobPost).attr('data-job-id');
                    const title = $('h6', jobPost).text();

                    return {
                        id,
                        url,
                        title,
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
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${AXIOS_HQ_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
