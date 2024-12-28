import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import {
    OpenaiJobPost,
    openaiJobPostAnalyzer,
} from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const ASTRONOMER_NAME = 'astronomer';
export const ASTRONOMER_INITIAL_URL =
    'https://www.astronomer.io/careers';

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

        const metaDescriptionContent = $('meta[name="description"]').attr('content');

        return openaiJobPostAnalyzer(`Location: ${locationText}. ${metaDescriptionContent}`);
    } catch (e) {
        console.log(`Error processing ${ASTRONOMER_NAME} job post ${id}`, e);
    }
};

export const astronomerScrapper: CompanyScrapperFn = async ({ companyId }) => {
    const $ = await fromURL(ASTRONOMER_INITIAL_URL);
    const jobPostsElements = $(JOB_POST_SELECTOR);

    const jobPosts: JobPostsListItem[] = jobPostsElements
        .toArray()
        .map((jobPost) => {
            const url = $(jobPost).attr('href');
            const textsContainer = $('span', jobPost).first();
            const texts = $('span', textsContainer).toArray();

            return {
                id: url.split('/').pop(),
                url,
                title: $(texts[0]).text(),
                locationText: $(texts[1]).text(),
            };
        });

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
            console.log(`Error processing ${ASTRONOMER_NAME}`, e);
        }
    }

    return data;
};
