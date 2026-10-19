import {
    ListedJobPostsData,
    NewCompanyScrapper,
    ScrappedJobPost,
} from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';
import { fetchJobListingJson } from '../fetchJobListingJson';
import { JobListingUnavailableError } from '../jobListingUnavailableError';

export const DEVELOCITY_NAME = 'develocity';
const DEVELOCITY_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/gradle/jobs?content=true';

type ScrapJobPostData = {
    id: string;
    title: string;
    content: string;
};

type GreenhouseJob = {
    id: number;
    title: string;
    absolute_url: string;
    updated_at: string;
    content: string;
    location?: { name?: string };
};

type GreenhouseJobsResponse = {
    jobs?: GreenhouseJob[];
};

const shouldSkipTitle = (title: string) => {
    const lower = title.toLowerCase();

    return (
        lower.includes('speculative application') ||
        lower.includes('talent pool') ||
        lower.includes('working student') ||
        lower.includes('internship') ||
        lower.includes('intern ')
    );
};

const scrapJobPost = async ({
    id,
    title,
    content,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        return openaiJobPostAnalyzer(`${title}\n${content}`);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${DEVELOCITY_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const develocityScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await fetchJobListingJson<GreenhouseJobsResponse>({
                companyName: DEVELOCITY_NAME,
                url: DEVELOCITY_INITIAL_URL,
            });

            if (!Array.isArray(jobsData.jobs)) {
                throw new JobListingUnavailableError(
                    DEVELOCITY_NAME,
                    DEVELOCITY_INITIAL_URL,
                );
            }

            return jobsData.jobs
                .filter((jobData) => !shouldSkipTitle(jobData.title))
                .map((jobData) => {
                    const location = jobData.location?.name?.trim();

                    return {
                        id: jobData.id.toString(),
                        url: jobData.absolute_url,
                        title: jobData.title,
                        createdAt: new Date(jobData.updated_at).getTime(),
                        content: location
                            ? `${location}\n${jobData.content}`
                            : jobData.content,
                    };
                });
        },

        scrapJobPost: async (jobPosts: ListedJobPostsData[]) => {
            const data: ScrappedJobPost[] = [];

            for (let i = 0; i < jobPosts.length; i++) {
                try {
                    const jobPost = jobPosts[i];
                    console.log(
                        `Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`,
                    );

                    const jobPostData = await scrapJobPost({
                        id: jobPost.id,
                        title: jobPost.title,
                        content: jobPost.content,
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
                        `[Error processing ${DEVELOCITY_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
