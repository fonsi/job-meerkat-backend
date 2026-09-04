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
import { fetchJobListingJson } from '../fetchJobListingJson';
import { JobListingUnavailableError } from '../jobListingUnavailableError';

export const SUPERHUMAN_NAME = 'superhuman';
const ASHBY_COMPANY_NAME = 'superhuman platform inc';
const SUPERHUMAN_INITIAL_URL = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(ASHBY_COMPANY_NAME)}`;

type ScrapJobPostData = {
    id: string;
};

type AshbyJobListing = {
    id: string;
    title: string;
    jobUrl: string;
    publishedAt: string;
    isListed: boolean;
    employmentType?: string;
};

type AshbyJobsResponse = {
    jobs?: AshbyJobListing[];
};

const shouldSkipListedJob = (
    title: string,
    employmentType?: string,
): boolean => {
    if (employmentType === 'Intern') return true;
    const lower = title.toLowerCase();
    if (
        lower.includes('general application') ||
        lower.includes('open application')
    ) {
        return true;
    }

    return /\bintern(?:ship)?s?\b/.test(lower);
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const jobsData = await getAshbyJobPostContent({
            companyName: ASHBY_COMPANY_NAME,
            jobPostId: id,
        });

        return openaiJobPostAnalyzer(JSON.stringify(jobsData));
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${SUPERHUMAN_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const superhumanScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await fetchJobListingJson<AshbyJobsResponse>({
                companyName: SUPERHUMAN_NAME,
                url: SUPERHUMAN_INITIAL_URL,
            });

            if (!Array.isArray(jobsData.jobs)) {
                throw new JobListingUnavailableError(
                    SUPERHUMAN_NAME,
                    SUPERHUMAN_INITIAL_URL,
                );
            }

            return jobsData.jobs.flatMap((jobData) => {
                const title = jobData.title.trim();
                if (
                    !jobData.isListed ||
                    shouldSkipListedJob(title, jobData.employmentType)
                ) {
                    return [];
                }

                return [
                    {
                        id: jobData.id,
                        url: jobData.jobUrl,
                        title,
                        createdAt: new Date(jobData.publishedAt).getTime(),
                    },
                ];
            });
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
                        `[Error processing ${SUPERHUMAN_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
