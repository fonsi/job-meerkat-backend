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

export const PLANET_SCALE_NAME = 'planetscale';
const PLANET_SCALE_INITIAL_URL = 'https://job-boards.greenhouse.io/planetscale';

type ScrapJobPostData = {
    id: string;
    url: string;
};

const JOB_POST_SELECTOR = '.job-post a';
const JOB_TITLE_SELECTOR = '.job__title';
const JOB_DESCRIPTION_SELECTOR = '.job__description';

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
            `Error processing ${PLANET_SCALE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const planetScaleScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const $ = await fromURL(PLANET_SCALE_INITIAL_URL);
            const jobPostsElements = $(JOB_POST_SELECTOR);

            const jobPosts: ListedJobPostsData[] = jobPostsElements
                .toArray()
                .map((jobPost) => {
                    const url = $(jobPost).attr('href');

                    return {
                        id: url.split('/').pop(),
                        url,
                        title: $('p', jobPost).first().text(),
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
                        `[Error processing ${PLANET_SCALE_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
