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

export const TINYBIRD_NAME = 'tinybird';
const BASE_URL = 'https://www.tinybird.co';
const TINYBIRD_INITIAL_URL = `${BASE_URL}/about`;

type ScrapJobPostData = {
    id: string;
    url: string;
};

const JOB_POST_SELECTOR = 'a[href*="/job-offers"]';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);
        const content = $('body').text();

        return openaiJobPostAnalyzer(content);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${TINYBIRD_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const tinybirdScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const $ = await fromURL(TINYBIRD_INITIAL_URL);
            const jobPostsElements = $(JOB_POST_SELECTOR);

            const jobPosts: ListedJobPostsData[] = jobPostsElements
                .toArray()
                .map((jobPost) => {
                    const url = `${BASE_URL}${$(jobPost).attr('href')}`;
                    const title = $('p.text-h5', $(jobPost).parent()).text();

                    return {
                        id: url.split('/').filter(Boolean).pop(),
                        url,
                        title,
                    };
                })
                .filter(
                    (jobPost) =>
                        jobPost.title !== '' &&
                        !jobPost.title
                            .toLowerCase()
                            .includes('open application'),
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
                        originalId: jobPost.id,
                        url: jobPost.url,
                        companyId,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${TINYBIRD_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
