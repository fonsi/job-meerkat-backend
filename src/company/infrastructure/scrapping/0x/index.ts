import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';
import { getAshbyJobPostContent } from '../ashbyGraphQLRequest';

export const ZERO_X_NAME = '0x';
const ZERO_X_INITIAL_URL = 'https://api.ashbyhq.com/posting-api/job-board/0x';

type ScrapJobPostData = {
    id: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
    createdAt: number;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const jobsData = await getAshbyJobPostContent({
            companyName: ZERO_X_NAME,
            jobPostId: id,
        });

        return openaiJobPostAnalyzer(JSON.stringify(jobsData));
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${ZERO_X_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const zeroXScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(ZERO_X_INITIAL_URL);
    const jobsData = await response.json();

    const jobPosts: JobPostsListItem[] = [];

    jobsData.jobs.forEach((jobData) => {
        const url = jobData.jobUrl;

        if (jobData.isListed) {
            jobPosts.push({
                id: jobData.id,
                url,
                title: jobData.title,
                createdAt: new Date(jobData.publishedAt).getTime(),
            });
        }
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
            });

            data.push({
                ...jobPostData,
                originalId: jobPost.id,
                url: jobPost.url,
                title: jobPost.title,
                companyId,
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            const error = errorWithPrefix(
                e,
                `[Error processing ${ZERO_X_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
