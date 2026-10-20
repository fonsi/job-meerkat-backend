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
import {
    buildLeverJobContent,
    LeverJobPosting,
    LeverSalaryRange,
    mapLeverSalaryRange,
} from '../leverJobContent';

export const EDPUZZLE_NAME = 'edpuzzle';
const EDPUZZLE_INITIAL_URL =
    'https://api.lever.co/v0/postings/edpuzzle?mode=json';

type ScrapJobPostData = {
    id: string;
    title: string;
    content: string;
    salaryRange?: LeverSalaryRange | null;
};

const scrapJobPost = async ({
    id,
    title,
    content,
    salaryRange,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const openaiJobPost = await openaiJobPostAnalyzer(
            `${title}\n${content}`,
        );
        const leverSalary = mapLeverSalaryRange(salaryRange);

        if (leverSalary) {
            openaiJobPost.salaryRange = leverSalary;
        }

        return openaiJobPost;
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${EDPUZZLE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const edpuzzleScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await fetchJobListingJson<LeverJobPosting[]>({
                companyName: EDPUZZLE_NAME,
                url: EDPUZZLE_INITIAL_URL,
            });

            if (!Array.isArray(jobsData)) {
                throw new JobListingUnavailableError(
                    EDPUZZLE_NAME,
                    EDPUZZLE_INITIAL_URL,
                );
            }

            return jobsData.map((jobData) => ({
                id: jobData.id,
                url: jobData.hostedUrl,
                title: jobData.text,
                createdAt: jobData.createdAt,
                content: buildLeverJobContent(jobData),
                data: {
                    salaryRange: jobData.salaryRange ?? null,
                },
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
                        salaryRange: jobPost.data
                            ?.salaryRange as LeverSalaryRange | null,
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
                        `[Error processing ${EDPUZZLE_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
