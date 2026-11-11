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

export const CREATIVE_X_NAME = 'creativex';
const CREATIVE_X_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/creativex/jobs?content=true';

type ScrapJobPostData = {
    id: string;
    title: string;
    content: string;
    locationText?: string;
};

const scrapJobPost = async ({
    id,
    title,
    content,
    locationText,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const locationLine = locationText ? `Location: ${locationText}\n` : '';

        return openaiJobPostAnalyzer(`${title}\n${locationLine}${content}`);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${CREATIVE_X_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const creativeXScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(CREATIVE_X_INITIAL_URL);
            const jobsData = await response.json();

            return jobsData.jobs.map((jobData) => ({
                id: jobData.id.toString(),
                url: jobData.absolute_url,
                title: jobData.title,
                createdAt: new Date(jobData.updated_at).getTime(),
                locationText: jobData.location?.name,
                content: jobData.content,
            }));
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
                        locationText: jobPost.locationText,
                    });

                    data.push({
                        ...jobPostData,
                        originalId: jobPost.id.toString(),
                        url: jobPost.url,
                        companyId,
                        createdAt: jobPost.createdAt,
                        location: jobPost.locationText || jobPostData.location,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `Error processing ${CREATIVE_X_NAME}`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
