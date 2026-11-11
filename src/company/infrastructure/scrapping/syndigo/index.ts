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

export const SYNDIGO_NAME = 'syndigo';
const SYNDIGO_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/syndigo/jobs?content=true';

type ScrapJobPostData = {
    id: string;
    title: string;
    content: string;
};

const shouldSkipTitle = (title: string) => {
    const lower = title.toLowerCase();

    return (
        lower.includes('future opportunities') ||
        lower.includes('talent community') ||
        lower.includes('talent pool') ||
        lower.includes('general application') ||
        lower.includes('open application')
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
            `Error processing ${SYNDIGO_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const syndigoScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(SYNDIGO_INITIAL_URL);
            const jobsData = await response.json();

            return jobsData.jobs
                .filter((jobData) => !shouldSkipTitle(jobData.title || ''))
                .map((jobData) => ({
                    id: jobData.id.toString(),
                    url: jobData.absolute_url,
                    title: jobData.title,
                    createdAt: new Date(jobData.updated_at).getTime(),
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
                        `Error processing ${SYNDIGO_NAME}`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
