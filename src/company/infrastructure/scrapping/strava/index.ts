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

export const STRAVA_NAME = 'strava';
const ASHBY_COMPANY_NAME = 'strava';
const STRAVA_INITIAL_URL = `https://api.ashbyhq.com/posting-api/job-board/${ASHBY_COMPANY_NAME}`;

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
            `Error processing ${STRAVA_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const stravaScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await fetchJobListingJson<AshbyJobsResponse>({
                companyName: STRAVA_NAME,
                url: STRAVA_INITIAL_URL,
            });

            if (!Array.isArray(jobsData.jobs)) {
                throw new JobListingUnavailableError(
                    STRAVA_NAME,
                    STRAVA_INITIAL_URL,
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
                        `[Error processing ${STRAVA_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
