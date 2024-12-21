import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { hash } from 'node:crypto';

export const PLANET_SCALE_NAME = 'planetscale';
export const PLANET_SCALE_DOMAIN = 'https://planetscale.com';
export const PLANET_SCALE_INITIAL_URL = `${PLANET_SCALE_DOMAIN}/careers`;

type ScrapJobPostData = {
    title: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
};

const JOB_POST_SELECTOR = 'main a[href*="/careers"]';
const JOB_CONTENT_SELECTOR = 'main';

const scrapJobPost = async ({
    title,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);
        const jobPostContent = $(JOB_CONTENT_SELECTOR).text();

        return openaiJobPostAnalyzer(jobPostContent);
    } catch (e) {
        console.log(
            `Error processing ${PLANET_SCALE_NAME} job post ${title}`,
            e,
        );
    }
};

export const planetScaleScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const $ = await fromURL(PLANET_SCALE_INITIAL_URL);
    const jobPostsElements = $(JOB_POST_SELECTOR);

    const jobPosts: JobPostsListItem[] = jobPostsElements
        .toArray()
        .map((jobPost) => {
            const url = `${PLANET_SCALE_DOMAIN}${$(jobPost).attr('href')}`;
            const title = $(jobPost).text();
            const id = hash('md5', title); // hash generated from the title because there isn't any job post id

            return {
                id,
                url,
                title,
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
            console.log(`Error processing ${PLANET_SCALE_NAME}`, e);
        }
    }

    return data;
};
