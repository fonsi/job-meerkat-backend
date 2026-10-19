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

export const FINN_NAME = 'finn';
const FINN_INITIAL_URL = 'https://api.lever.co/v0/postings/finn?mode=json';

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

const shouldSkipTitle = (title: string) => {
    const lower = title.toLowerCase();

    return (
        lower.includes('initiative application') ||
        lower.includes('internship') ||
        lower.includes('working student') ||
        lower.includes('werkstudent')
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
            `Error processing ${FINN_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const finnScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await fetchJobListingJson<LeverJobPosting[]>({
                companyName: FINN_NAME,
                url: FINN_INITIAL_URL,
            });

            if (!Array.isArray(jobsData)) {
                throw new JobListingUnavailableError(
                    FINN_NAME,
                    FINN_INITIAL_URL,
                );
            }

            return jobsData
                .filter((jobData) => !shouldSkipTitle(jobData.text))
                .map((jobData) => ({
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
                        `[Error processing ${FINN_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
