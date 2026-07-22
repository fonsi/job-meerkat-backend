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
import { hash } from 'node:crypto';
import { logger } from 'shared/infrastructure/logger/logger';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';

export const STREAK_NAME = 'streak';
const STREAK_DOMAIN = 'https://www.streak.com';
const STREAK_INITIAL_URL = `${STREAK_DOMAIN}/careers`;

type ScrapJobPostData = {
    title: string;
    url: string;
};

const JOB_POST_SELECTOR = 'a.career11_item[href*="/careers/"]';
const JOB_TITLE_SELECTOR = 'h3';
const JOB_HEADER_SELECTOR = 'h1';
const JOB_META_SELECTOR = '.career11_job-details-wrapper';
const JOB_CONTENT_SELECTOR = '.w-richtext';

const scrapJobPost = async ({
    title,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);
        const jobPostHeader = $(JOB_HEADER_SELECTOR).first().text();
        const jobPostMeta = $(JOB_META_SELECTOR).text();
        const jobPostContent = $(JOB_CONTENT_SELECTOR).first().text();

        return openaiJobPostAnalyzer(
            `${jobPostHeader} ${jobPostMeta} ${jobPostContent}`,
        );
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${STREAK_NAME} job post ${title}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const streakScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const $ = await fromURL(STREAK_INITIAL_URL);
            const jobPostsElements = $(JOB_POST_SELECTOR);

            const jobPosts: ListedJobPostsData[] = jobPostsElements
                .toArray()
                .map((jobPost) => {
                    const href = $(jobPost).attr('href');
                    const url = href?.startsWith('http')
                        ? href
                        : `${STREAK_DOMAIN}${href}`;
                    const title = $(JOB_TITLE_SELECTOR, jobPost).text().trim();
                    const id = hash('md5', url);

                    return {
                        id,
                        url,
                        title,
                    };
                })
                .filter(
                    ({ title, url }) =>
                        Boolean(title) &&
                        !url.endsWith('/careers') &&
                        !title.toLowerCase().includes('intern') &&
                        !title.toLowerCase().includes('open application'),
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
                        title: jobPost.title,
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
                        `[Error processing ${STREAK_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
