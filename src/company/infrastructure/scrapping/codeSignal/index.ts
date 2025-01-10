import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const CODE_SIGNAL_NAME = 'codesignal';
const CODE_SIGNAL_INITIAL_URL =
    'https://job-boards.greenhouse.io/codesignal?_data=routes%2F%24url_token';

type ScrapJobPostData = {
    id: number;
    url: string;
    location: string;
};

type JobPostsListItem = {
    id: number;
    url: string;
    title: string;
    createdAt: number;
    location: string;
};

const JOB_HEADER_SELECTOR = '.job__header';
const JOB_CONTENT_SELECTOR = '.job__description';

const scrapJobPost = async ({
    id,
    url,
    location,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const jobPostHeader = $(JOB_HEADER_SELECTOR).text();
        const jobPostContent = $(JOB_CONTENT_SELECTOR).text();

        return openaiJobPostAnalyzer(
            `Location: ${location}. ${jobPostHeader} ${jobPostContent}`,
        );
    } catch (e) {
        console.log(`Error processing ${CODE_SIGNAL_NAME} job post ${id}`, e);
    }
};

export const codeSignalScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(CODE_SIGNAL_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = jobsData.jobPosts.data.map(
        (jobData) => {
            const url = jobData.absolute_url;

            return {
                id: jobData.id,
                url,
                title: jobData.title,
                createdAt: new Date(jobData.updated_at).getTime(),
                location: jobData.location,
            };
        },
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
                location: jobPost.location,
            });

            data.push({
                ...jobPostData,
                originalId: jobPost.id.toString(),
                url: jobPost.url,
                companyId,
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            console.log(`Error processing ${CODE_SIGNAL_NAME}`, e);
        }
    }

    return data;
};
