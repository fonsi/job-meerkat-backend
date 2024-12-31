import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const CIRCLE_NAME = 'circle';
export const CIRCLE_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/circleso/jobs?content=true';

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
        console.log(`Error processing ${CIRCLE_NAME} job post ${id}`, e);
    }
};

export const circleScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(CIRCLE_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = jobsData.jobs.map((jobData) => {
        const url = jobData.absolute_url;

        return {
            id: jobData.id,
            url,
            title: jobData.title,
            createdAt: new Date(jobData.updated_at).getTime(),
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
                originalId: jobPost.id.toString(),
                url: jobPost.url,
                companyId,
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            console.log(`Error processing ${CIRCLE_NAME}`, e);
        }
    }

    return data;
};