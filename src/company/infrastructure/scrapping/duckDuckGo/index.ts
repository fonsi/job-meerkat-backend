import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const DUCK_DUCK_GO_NAME = 'duckduckgo';
export const DUCK_DUCK_GO_INITIAL_URL = 'https://duckduckgo.com/jobs.js';

type ScrapJobPostData = {
    id: string;
    data: Record<string, unknown>;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
    createdAt: number;
    data: Record<string, unknown>;
};

const scrapJobPost = async ({
    id,
    data,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        return openaiJobPostAnalyzer(JSON.stringify(data));
    } catch (e) {
        console.log(`Error processing ${DUCK_DUCK_GO_NAME} job post ${id}`, e);
    }
};

export const duckDuckGoScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(DUCK_DUCK_GO_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = [];

    jobsData.jobs.forEach((jobData) => {
        const url = jobData.jobUrl;

        jobPosts.push({
            id: jobData.id,
            url,
            title: jobData.title,
            createdAt: new Date(jobData.publishedAt).getTime(),
            data: jobData,
        });
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
                data: jobPost.data,
            });

            data.push({
                ...jobPostData,
                originalId: jobPost.id,
                url: jobPost.url,
                companyId,
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            console.log(`Error processing ${DUCK_DUCK_GO_NAME}`, e);
        }
    }

    return data;
};
