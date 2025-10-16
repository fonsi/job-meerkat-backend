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
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { getGemJobPostContent, getGemJobPosts } from '../gemGraphQL';

export const BLUESKY_NAME = 'bluesky';
const BLUESKY_JOB_POST_URL = 'https://jobs.gem.com/bluesky';

type ScrapJobPostData = {
    id: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
    createdAt?: number;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const jobPostContent = await getGemJobPostContent({
            companyName: BLUESKY_NAME,
            atsId: id,
        });
        const createdAt = jobPostContent.publishedDateTs
            ? (jobPostContent.publishedDateTs as number) * 1000
            : undefined;
        const analyzedJobPost = await openaiJobPostAnalyzer(
            JSON.stringify(jobPostContent),
        );

        return {
            ...analyzedJobPost,
            createdAt,
        };
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${BLUESKY_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const blueskyScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await getGemJobPosts({
                companyName: BLUESKY_NAME,
            });

            const jobPosts: JobPostsListItem[] = jobsData.map((jobData) => {
                const url = `${BLUESKY_JOB_POST_URL}/${jobData.atsId}`;

                return {
                    id: jobData.atsId,
                    url,
                    title: jobData.title,
                    createdAt: jobData.publishedDateTs
                        ? (jobData.publishedDateTs as number) * 1000
                        : undefined,
                };
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
                        `Error processing ${BLUESKY_NAME}`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
