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

export const HOSPITABLE_NAME = 'hospitable';
const WORKABLE_ACCOUNT = 'hospitable';
const WIDGET_URL = `https://apply.workable.com/api/v1/widget/accounts/${WORKABLE_ACCOUNT}`;

type ScrapJobPostData = {
    id: string;
};

type WorkableListJob = {
    shortcode: string;
    title: string;
};

const shouldSkipTitle = (title: string) => {
    const lower = title.toLowerCase();

    return (
        lower.includes('talent community') ||
        lower.includes('general application') ||
        lower.includes('open application')
    );
};

const fetchAllWorkableJobs = async (): Promise<WorkableListJob[]> => {
    const response = await fetch(WIDGET_URL);
    const jobsData = await response.json();
    const seen = new Set<string>();
    const jobs: WorkableListJob[] = [];

    for (const job of jobsData.jobs || []) {
        if (!job.shortcode || seen.has(job.shortcode)) continue;
        seen.add(job.shortcode);
        jobs.push(job);
    }

    return jobs;
};

const scrapJobPost = async ({
    id,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const url = `https://apply.workable.com/api/v2/accounts/${WORKABLE_ACCOUNT}/jobs/${id}`;
        const response = await fetch(url);
        const jobData = await response.json();
        const publishedDate = jobData.published;

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
            `Error processing ${HOSPITABLE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const hospitableScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const jobsData = await fetchAllWorkableJobs();
            const jobPosts: ListedJobPostsData[] = [];

            jobsData.forEach((jobData) => {
                if (shouldSkipTitle(jobData.title || '')) return;

                const id = jobData.shortcode;
                jobPosts.push({
                    id,
                    url: `https://apply.workable.com/${WORKABLE_ACCOUNT}/j/${id}`,
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
                        originalId: jobPost.id,
                        url: jobPost.url,
                        title: jobPost.title,
                        companyId,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${HOSPITABLE_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
