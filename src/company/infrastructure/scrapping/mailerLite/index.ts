import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const MAILER_LITE_NAME = 'mailerlite';
const MAILER_LITE_BASE_URL = 'https://www.mailerlite.com';
const MAILER_LITE_INITIAL_URL = `${MAILER_LITE_BASE_URL}/jobs`;

type ScrapJobPostData = {
    id: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
};

const JOB_POST_SELECTOR = 'div.flex > a[href*="/jobs/"]';

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);
        $('script, head, footer, iframe').remove();
        const content = $('body').text();

        return openaiJobPostAnalyzer(content);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${MAILER_LITE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const mailerLiteScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const $ = await fromURL(MAILER_LITE_INITIAL_URL);
    const jobPostsElements = $(JOB_POST_SELECTOR);

    const jobPosts: JobPostsListItem[] = jobPostsElements
        .toArray()
        .map((jobPost) => {
            const url = `${MAILER_LITE_BASE_URL}${$(jobPost).attr('href')}`;

            return {
                id: url.split('/').pop(),
                url,
                title: $(jobPost).text().trim(),
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
                `[Error processing ${MAILER_LITE_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
