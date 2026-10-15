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

export const MODASH_NAME = 'modash';
const WORKABLE_ACCOUNT = 'modash';
const MODASH_INITIAL_URL = `https://apply.workable.com/api/v3/accounts/${WORKABLE_ACCOUNT}/jobs`;

type ScrapJobPostData = {
    id: string;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const url = `https://apply.workable.com/api/v2/accounts/${WORKABLE_ACCOUNT}/jobs/${id}`;
        const response = await fetch(url);
        const jobData = await response.json();
        const publishedDate = jobData.published;

        // Pass full Workable payload — salary/workplace/locations live outside description HTML.
        const openaiJobPost = await openaiJobPostAnalyzer(
            JSON.stringify(jobData),
        );

        if (publishedDate) {
            openaiJobPost.createdAt = new Date(publishedDate).getTime();
        }

        return openaiJobPost;
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${MODASH_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const modashScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(MODASH_INITIAL_URL, {
                method: 'POST',
            });
            const jobsData = (await response.json()).results;
            const jobPosts: ListedJobPostsData[] = [];

            jobsData.forEach((jobData) => {
                const title = jobData.title?.toLowerCase?.() || '';
                if (
                    title.includes('talent community') ||
                    title.includes('general application') ||
                    title.includes('open application')
                ) {
                    return;
                }

                const id = jobData.shortcode;
                jobPosts.push({
                    id,
                    url: `https://apply.workable.com/${WORKABLE_ACCOUNT}/j/${id}`,
                    title: jobData.title,
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
                    });

                    data.push({
                        ...jobPostData,
                        originalId: jobPost.id,
                        url: jobPost.url,
                        title: jobPost.title,
                        companyId,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${MODASH_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
