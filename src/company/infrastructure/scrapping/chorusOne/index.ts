import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { logger } from 'shared/infrastructure/logger/logger';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';

export const CHORUS_ONE_NAME = 'chorus one';
const CHORUS_ONE_INITIAL_URL = 'https://careers.chorus.one/api/offers';

type ScrapJobPostData = {
    id: number;
    url: string;
};

type JobPostsListItem = {
    id: number;
    url: string;
    title: string;
    createdAt: number;
};

const JOB_CONTENT_SELECTOR = 'main';

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
            `Error processing ${CHORUS_ONE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const chorusOneScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(CHORUS_ONE_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = jobsData.offers
        .map((jobData) => {
            const url = jobData.careers_url;

            return {
                id: jobData.id,
                url,
                title: jobData.title,
                createdAt: new Date(jobData.created_at).getTime(),
            };
        })
        .filter(
            (jobPost: JobPostsListItem) =>
                !jobPost.title.includes('Talent Pool'),
        );

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
                title: jobPost.title,
                companyId,
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            const error = errorWithPrefix(
                e,
                `[Error processing ${CHORUS_ONE_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
