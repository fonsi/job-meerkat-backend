import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import {
    ListedJobPostsData,
    NewCompanyScrapper,
    ScrappedJobPost,
} from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { logger } from 'shared/infrastructure/logger/logger';

export const DUOLINGO_NAME = 'duolingo';
const DUOLINGO_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/duolingo/jobs?content=true';

type ScrapJobPostData = {
    id: string;
    content: string;
};

const scrapJobPost = async ({
    id,
    content,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        return openaiJobPostAnalyzer(content);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${DUOLINGO_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const duolingoScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(DUOLINGO_INITIAL_URL);
            const jobsData = (await response.json()) as {
                jobs: Array<{
                    internal_job_id: number;
                    absolute_url: string;
                    title: string;
                    updated_at: string;
                    location?: { name: string };
                    content: string;
                }>;
            };

            const jobPosts: ListedJobPostsData[] = [];

            jobsData.jobs.forEach((jobData) => {
                const url = jobData.absolute_url;

                jobPosts.push({
                    id: jobData.internal_job_id.toString(),
                    url,
                    title: jobData.title,
                    createdAt: new Date(jobData.updated_at).getTime(),
                    locationText: jobData.location?.name,
                    content: jobData.content,
                });
            });

            return jobPosts;
        },

        scrapJobPost: async (jobPosts: ListedJobPostsData[]) => {
            const data: ScrappedJobPost[] = [];

            for (let i = 0; i < jobPosts.length; i++) {
                try {
                    const jobPost = jobPosts[i];
                    console.log(
                        `Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`,
                    );

                    if (!jobPost.content) {
                        continue;
                    }

                    const jobPostData = await scrapJobPost({
                        id: jobPost.id,
                        content: jobPost.content,
                    });

                    data.push({
                        ...jobPostData,
                        originalId: jobPost.id,
                        url: jobPost.url,
                        companyId,
                        createdAt: jobPost.createdAt,
                        location: jobPost.locationText || jobPostData.location,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${DUOLINGO_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
