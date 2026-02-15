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

export const RETOOL_NAME = 'retool';
const RETOOL_JOB_POST_URL = 'https://jobs.gem.com/retool';

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
            companyName: RETOOL_NAME,
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
            `Error processing ${RETOOL_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const retoolScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await getGemJobPosts({
                companyName: RETOOL_NAME,
            });

            const jobPosts: JobPostsListItem[] = jobsData.map((jobData) => {
                const url = `${RETOOL_JOB_POST_URL}/${jobData.atsId}`;

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
                        `Error processing ${RETOOL_NAME}`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
