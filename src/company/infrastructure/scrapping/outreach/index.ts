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
import { fetchJobListingJson } from '../fetchJobListingJson';
import { JobListingUnavailableError } from '../jobListingUnavailableError';

export const OUTREACH_NAME = 'outreach';
const OUTREACH_INITIAL_URL =
    'https://api.lever.co/v0/postings/outreach?mode=json';

type ScrapJobPostData = {
    id: string;
    title: string;
    content: string;
};

type LeverJobPosting = {
    id: string;
    hostedUrl: string;
    text: string;
    createdAt: number;
    descriptionPlain: string;
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
            `Error processing ${OUTREACH_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const outreachScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await fetchJobListingJson<LeverJobPosting[]>({
                companyName: OUTREACH_NAME,
                url: OUTREACH_INITIAL_URL,
            });

            if (!Array.isArray(jobsData)) {
                throw new JobListingUnavailableError(
                    OUTREACH_NAME,
                    OUTREACH_INITIAL_URL,
                );
            }

            return jobsData.map((jobData) => ({
                id: jobData.id,
                url: jobData.hostedUrl,
                title: jobData.text,
                createdAt: jobData.createdAt,
                content: jobData.descriptionPlain,
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
                        originalId: jobPost.id,
                        url: jobPost.url,
                        title: jobPost.title,
                        companyId,
                        createdAt: jobPost.createdAt,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${OUTREACH_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
