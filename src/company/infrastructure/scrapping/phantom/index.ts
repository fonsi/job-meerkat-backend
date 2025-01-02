import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const PHANTOM_NAME = 'phantom';
export const PHANTOM_INITIAL_URL =
    'https://api.ashbyhq.com/posting-api/job-board/phantom';

type ScrapJobPostData = {
    id: number;
    url: string;
    locationText: string;
};

type JobPostsListItem = {
    id: number;
    url: string;
    title: string;
    createdAt: number;
    locationText: string;
};

const scrapJobPost = async ({
    id,
    url,
    locationText,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const metaDescriptionContent = $('meta[name="description"]').attr(
            'content',
        );

        return openaiJobPostAnalyzer(
            `Location: ${locationText}. ${metaDescriptionContent}`,
        );
    } catch (e) {
        console.log(`Error processing ${PHANTOM_NAME} job post ${id}`, e);
    }
};

export const phantomScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(PHANTOM_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = [];

    jobsData.jobs.forEach((jobData) => {
        const url = jobData.jobUrl;

        jobPosts.push({
            id: jobData.id,
            url,
            title: jobData.title,
            createdAt: new Date(jobData.publishedAt).getTime(),
            locationText: jobData.location,
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
                url: jobPost.url,
                locationText: jobPost.locationText,
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
            console.log(`Error processing ${PHANTOM_NAME}`, e);
        }
    }

    return data;
};
