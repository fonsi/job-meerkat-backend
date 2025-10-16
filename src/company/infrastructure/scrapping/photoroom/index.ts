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

export const PHOTOROOM_NAME = 'photoroom';
const PHOTOROOM_INITIAL_URL = 'https://www.photoroom.com/company';

type ScrapJobPostData = {
    id: string;
    url: string;
    locationText: string;
};

type JobPostsListItem = {
    id: string;
    url: string;
    title: string;
    locationText: string;
};

const JOB_POST_SELECTOR = '#careers+div a[href*="jobs.ashbyhq.com"]';

const scrapJobPost = async ({
    id,
    url,
    locationText,
}: ScrapJobPostData): Promise<OpenaiJobPost> => {
    try {
        const $ = await fromURL(url);

        const metaDescriptionContent = $('meta[name="description"]').attr(
            'content',
        );

        return openaiJobPostAnalyzer(
            `Location: (${locationText}). ${metaDescriptionContent}`,
        );
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${PHOTOROOM_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const photoroomScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const $ = await fromURL(PHOTOROOM_INITIAL_URL);
            const jobPostsElements = $(JOB_POST_SELECTOR);

            const jobPosts: JobPostsListItem[] = jobPostsElements
                .toArray()
                .map((jobPost) => {
                    const url = $(jobPost).attr('href');
                    const locationText = $(jobPost).text().split(',').pop();

                    return {
                        id: url.split('/').pop(),
                        url,
                        title: $('span', jobPost).first().text(),
                        locationText,
                    };
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
                        url: jobPost.url,
                        locationText: jobPost.locationText,
                    });

                    data.push({
                        ...jobPostData,
                        originalId: jobPost.id,
                        url: jobPost.url,
                        companyId,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${PHOTOROOM_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
