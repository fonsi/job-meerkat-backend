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

export const ASTRONOMER_NAME = 'astronomer';
const ASTRONOMER_INITIAL_URL = 'https://www.astronomer.io/careers';

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

const JOB_POST_SELECTOR = 'a[class*="_job"]';

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
            `Location: ${locationText}. ${metaDescriptionContent}`,
        );
    } catch (e) {
        const error = errorWithPrefix(
            e,
            `Error processing ${ASTRONOMER_NAME} job post ${id}`,
        );

        console.log(error);
        logger.error(error);
    }
};

export const astronomerScrapper: NewCompanyScrapper = ({ companyId }) => {
    return {
        getListedJobPostsData: async () => {
            const $ = await fromURL(ASTRONOMER_INITIAL_URL);
            const jobPostsElements = $(JOB_POST_SELECTOR);

            const jobPosts: JobPostsListItem[] = jobPostsElements
                .toArray()
                .map((jobPost) => {
                    const url = $(jobPost).attr('href');
                    const texts = $('span', jobPost).toArray();

                    return {
                        id: url.split('/').pop(),
                        url,
                        title: $(texts[1]).text(),
                        locationText: $(texts[2]).text()?.split('-')[0].trim(),
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
                        title: jobPost.title,
                        companyId,
                    });
                } catch (e) {
                    const error = errorWithPrefix(
                        e,
                        `[Error processing ${ASTRONOMER_NAME}]`,
                    );

                    console.log(error);
                    logger.error(error);
                }
            }

            return data;
        },
    };
};
