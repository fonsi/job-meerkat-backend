import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const HUMAN_SIGNAL_NAME = 'humansignal';
const HUMAN_SIGNAL_INITIAL_URL = 'https://humansignal.com/careers/';

type ScrapJobPostData = {
    id: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
};

const JOB_POST_SELECTOR = '.CareersListCardTitle';
const JOB_HEADER_SELECTOR = '.job__header';
const JOB_DESCRIPTION_SELECTOR = '.job__description';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const tagsText = $(JOB_HEADER_SELECTOR).text();
        const titleText = $(JOB_DESCRIPTION_SELECTOR).text();
        const jobPostContent = `${tagsText} ${titleText}`;

        return openaiJobPostAnalyzer(jobPostContent);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${HUMAN_SIGNAL_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const humanSignalScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const $ = await fromURL(HUMAN_SIGNAL_INITIAL_URL);
    const jobPostsElements = $(JOB_POST_SELECTOR);

    const jobPosts: JobPostsListItem[] = jobPostsElements
        .toArray()
        .map((jobPost) => {
            const url = $(jobPost).attr('href');

            return {
                id: url.split('/').filter(Boolean).pop(),
                url,
                title: $(jobPost).text(),
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
                `[Error processing ${HUMAN_SIGNAL_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
