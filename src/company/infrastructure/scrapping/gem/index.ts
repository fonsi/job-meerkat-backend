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

export const GEM_NAME = 'gem';
const GEM_NAME_JOB_POST_URL = 'https://jobs.gem.com/gem';

type ScrapJobPostData = {
    id: string;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const jobPostContent = await getGemJobPostContent({
            companyName: 'gem',
            atsId: id,
        });
        const createdAt = jobPostContent.publishedDateTs
            ? (jobPostContent.publishedDateTs as number) * 1000
            : undefined;
        const analyzedJobPost = await openaiJobPostAnalyzer(
            JSON.stringify(jobPostContent),
        );

        return { ...analyzedJobPost, createdAt };
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${GEM_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const gemScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await getGemJobPosts({ companyName: 'gem' });

            return jobsData.map((jobData) => ({
                id: jobData.atsId,
                url: `${GEM_NAME_JOB_POST_URL}/${jobData.atsId}`,
                title: jobData.title,
                createdAt: jobData.publishedDateTs
                    ? (jobData.publishedDateTs as number) * 1000
                    : undefined,
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
                        `[Error processing ${GEM_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
