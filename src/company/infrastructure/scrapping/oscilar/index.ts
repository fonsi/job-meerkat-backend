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
import { getAshbyJobPostContent } from '../ashbyGraphQLRequest';

export const OSCILAR_NAME = 'oscilar';
const ASHBY_BOARD = 'oscilar';
const OSCILAR_INITIAL_URL = `https://api.ashbyhq.com/posting-api/job-board/${ASHBY_BOARD}`;

type ScrapJobPostData = {
    id: string;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const jobsData = await getAshbyJobPostContent({
            companyName: ASHBY_BOARD,
            jobPostId: id,
        });

        return openaiJobPostAnalyzer(JSON.stringify(jobsData));
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${OSCILAR_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const oscilarScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(OSCILAR_INITIAL_URL);
            const jobsData = await response.json();
            const jobPosts: ListedJobPostsData[] = [];

            jobsData.jobs.forEach((jobData) => {
                const title = jobData.title?.toLowerCase?.() || '';
                if (
                    jobData.isListed &&
                    !title.includes('talent community') &&
                    !title.includes('general application') &&
                    !title.includes('open application')
                ) {
                    jobPosts.push({
                        id: jobData.id,
                        url: jobData.jobUrl,
                        title: jobData.title,
                        createdAt: new Date(jobData.publishedAt).getTime(),
                    });
                }
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

                    const jobPostData = await scrapJobPost({ id: jobPost.id });

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
                        `[Error processing ${OSCILAR_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
