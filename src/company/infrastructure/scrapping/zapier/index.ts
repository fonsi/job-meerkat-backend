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

export const ZAPIER_NAME = 'zapier';
const ZAPIER_INITIAL_URL =
    'https://api.ashbyhq.com/posting-api/job-board/zapier';

type ScrapJobPostData = {
    id: string;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const jobsData = await getAshbyJobPostContent({
            companyName: ZAPIER_NAME,
            jobPostId: id,
        });

        return openaiJobPostAnalyzer(JSON.stringify(jobsData));
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${ZAPIER_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const zapierScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(ZAPIER_INITIAL_URL);
            const jobsData = await response.json();

            const jobPosts: ListedJobPostsData[] = [];

            jobsData.jobs.forEach((jobData) => {
                const url = jobData.jobUrl;

                if (
                    jobData.isListed &&
                    !(jobData.title as string)
                        .toLowerCase()
                        .includes('talent community')
                ) {
                    jobPosts.push({
                        id: jobData.id,
                        url,
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
                        `[Error processing ${ZAPIER_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
