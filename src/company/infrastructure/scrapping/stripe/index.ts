import { fromURL } from 'cheerio';
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

export const STRIPE_NAME = 'stripe';
const STRIPE_NAME_INITIAL_URL =
    'https://boards-api.greenhouse.io/v1/boards/stripe/jobs?content=true';

type ScrapJobPostData = {
    id: string;
    url: string;
};

const scrapJobPost = async ({
    id,
    url,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        // Stripe hosts jobs on stripe.com; Greenhouse API `content` omits pay/benefits.
        // absolute_url (?gh_jid=) redirects to the full listing with salary.
        const $ = await fromURL(url);
        const jobPostContent = $('body').text();

        return openaiJobPostAnalyzer(jobPostContent);
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${STRIPE_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const stripeScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const response = await fetch(STRIPE_NAME_INITIAL_URL);
            const jobsData = await response.json();

            return jobsData.jobs
                .map((jobData) => ({
                    id: jobData.id.toString(),
                    url: jobData.absolute_url,
                    title: jobData.title,
                    createdAt: new Date(jobData.updated_at).getTime(),
                }))
                .filter(({ title }) => {
                    const lower = title.toLowerCase();
                    return (
                        !lower.includes('intern') &&
                        !lower.includes('open application') &&
                        !lower.includes('general application')
                    );
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
                        url: jobPost.url,
                    });

                    data.push({
                        ...jobPostData,
                        originalId: jobPost.id.toString(),
                        url: jobPost.url,
                        companyId,
                        createdAt: jobPost.createdAt,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `Error processing ${STRIPE_NAME}`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
