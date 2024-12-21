import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const ALL_TRAILS_NAME = 'alltrails';
export const ALL_TRAILS_INITIAL_URL =
    'https://api.lever.co/v0/postings/alltrails?mode=json';

type ScrapJobPostData = {
    id: string;
    url: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
    createdAt: number;
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
        console.log(`Error processing ${ALL_TRAILS_NAME} job post ${id}`, e);
    }
};

export const allTrailsScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(ALL_TRAILS_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = jobsData.map((jobData) => {
        const url = jobData.hostedUrl;

        return {
            id: jobData.id,
            url,
            title: jobData.text,
            createdAt: jobData.createdAt,
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
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            console.log(`Error processing ${ALL_TRAILS_NAME}`, e);
        }
    }

    return data;
};
