import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

export const LATTICE_NAME = 'lattice';
const LATTICE_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/lattice/jobs';

type ScrapJobPostData = {
    id: number;
};

type JobPostsListItem = {
    id: number;
    url: string;
    title: string;
    createdAt: number;
};

const JOB_HEADER_SELECTOR = '.job__header';
const JOB_CONTENT_SELECTOR = '.job__description';
const JOB_LOCATION_SELECTOR = '.job__location';

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(
            `https://job-boards.greenhouse.io/embed/job_app?for=lattice&token=${id}`,
        );

        const jobPostHeader = $(JOB_HEADER_SELECTOR).text();
        const jobPostContent = $(JOB_CONTENT_SELECTOR).text();
        const jobPostLocation = $(JOB_LOCATION_SELECTOR).text();

        return openaiJobPostAnalyzer(
            `Location: ${jobPostLocation}. ${jobPostHeader} ${jobPostContent}`,
        );
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${LATTICE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const latticeScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const response = await fetch(LATTICE_INITIAL_URL);
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
            });

            data.push({
                ...jobPostData,
                originalId: jobPost.id.toString(),
                url: jobPost.url,
                companyId,
                createdAt: jobPost.createdAt,
            });
        } catch (e) {
            const error = errorWithPrefix(
                e,
                `[Error processing ${LATTICE_NAME}]`,
            );

            console.log(error);
            logger.error(error);
        }
    }

    return data;
};
