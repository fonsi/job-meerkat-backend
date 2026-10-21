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
import { getPinpointJobPosts } from '../pinpointPostings';

export const CLIMATE_BONDS_INITIATIVE_NAME = 'climate bonds initiative';
const CLIMATE_BONDS_PINPOINT_SUBDOMAIN = 'climatebonds';

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
            `Error processing ${CLIMATE_BONDS_INITIATIVE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const climateBondsInitiativeScrapper: NewCompanyScrapper = ({
    companyId,
}) => {
    return {
        getListedJobPostsData: async () =>
            getPinpointJobPosts({
                companyName: CLIMATE_BONDS_INITIATIVE_NAME,
                subdomain: CLIMATE_BONDS_PINPOINT_SUBDOMAIN,
            }),

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
                        originalId: jobPost.id,
                        url: jobPost.url,
                        title: jobPost.title,
                        companyId,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${CLIMATE_BONDS_INITIATIVE_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
