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

export const FEELD_NAME = 'feeld';
const WORKABLE_ACCOUNT = 'feeldco';
const FEELD_JOBS_URL = `https://apply.workable.com/api/v3/accounts/${WORKABLE_ACCOUNT}/jobs`;
// Safety net so a misbehaving nextPage token can never loop forever.
const MAX_PAGES = 20;

type WorkableListedJob = {
    shortcode?: string;
    title?: string;
    state?: string;
};

type WorkableJobsResponse = {
    results?: WorkableListedJob[];
    nextPage?: string;
};

type ScrapJobPostData = {
    id: string;
};

export const buildFeeldJobUrl = (shortcode: string): string =>
    `https://apply.workable.com/${WORKABLE_ACCOUNT}/j/${shortcode}`;

const fetchListedJobs = async (): Promise<WorkableListedJob[]> => {
    const jobs: WorkableListedJob[] = [];
    let token: string | undefined;

    for (let page = 0; page < MAX_PAGES; page++) {
        const response = await fetch(FEELD_JOBS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(token ? { token } : {}),
        });

        if (!response.ok) {
            throw new Error(
                `Workable jobs request for ${WORKABLE_ACCOUNT} failed with status ${response.status}`,
            );
        }

        const data = (await response.json()) as WorkableJobsResponse;
        const results = data.results ?? [];
        jobs.push(...results);

        if (!data.nextPage || results.length === 0) {
            break;
        }

        token = data.nextPage;
    }

    return jobs;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const url = `https://apply.workable.com/api/v2/accounts/${WORKABLE_ACCOUNT}/jobs/${id}`;
        const response = await fetch(url);
        const jobData = (await response.json()) as Record<string, unknown>;
        const publishedDate = jobData.published as string;

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
            `Error processing ${FEELD_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const feeldScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        // Workable shortcode (e.g. 24D9AA3784) is used as the id everywhere so
        // that listed ids always match the stored originalId. The numeric
        // Workable id shown on feeld.co/careers must not be used.
        getListedJobPostsData: async () => {
            const jobsData = await fetchListedJobs();
            const seen = new Set<string>();
            const jobPosts: ListedJobPostsData[] = [];

            jobsData.forEach((jobData) => {
                const id = jobData.shortcode;
                if (!id || seen.has(id)) {
                    return;
                }
                if (jobData.state && jobData.state !== 'published') {
                    return;
                }
                seen.add(id);

                jobPosts.push({
                    id,
                    url: buildFeeldJobUrl(id),
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
                        title: jobPost.title,
                        originalId: jobPost.id,
                        url: jobPost.url,
                        companyId,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${FEELD_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
