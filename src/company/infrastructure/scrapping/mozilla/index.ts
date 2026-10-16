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

export const MOZILLA_NAME = 'mozilla';
const MOZILLA_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/mozilla/jobs?content=true';

type ScrapJobPostData = {
    id: string;
    title: string;
    content: string;
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
            `Error processing ${MOZILLA_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const mozillaScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(MOZILLA_INITIAL_URL);
            const jobsData = await response.json();
            const jobPosts: ListedJobPostsData[] = [];

            jobsData.jobs.forEach((jobData) => {
                const title = jobData.title?.toLowerCase?.() || '';
                if (
                    title.includes('intern') ||
                    title.includes('internship') ||
                    title.includes('talent community') ||
                    title.includes('talent pool') ||
                    title.includes('general application')
                ) {
                    return;
                }

                jobPosts.push({
                    id: jobData.id.toString(),
                    url: jobData.absolute_url,
                    title: jobData.title,
                    createdAt: new Date(jobData.updated_at).getTime(),
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

                    const jobPostData = await scrapJobPost({
                        id: jobPost.id,
                        title: jobPost.title,
                        content: jobPost.content || '',
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
                        `[Error processing ${MOZILLA_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
