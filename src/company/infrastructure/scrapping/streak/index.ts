import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';
import { hash } from 'node:crypto';

export const STREAK_NAME = 'streak';
export const STREAK_DOMAIN = 'https://streak.com';
export const STREAK_INITIAL_URL = `${STREAK_DOMAIN}/careers`;

type ScrapJobPostData = {
  title: string;
  url: string;
}

type JobPostsListItem = {
  id: string;
  url: string;
  title: string;
}

const JOB_POST_SELECTOR = '.careers a[href*="/careers"]';
const JOB_CONTENT_SELECTOR = '.content-wrapper';

const scrapJobPost = async ({ title, url }: ScrapJobPostData ): Promise<OpenaiJobPost> => {
    try {
      const $ = await fromURL(url);
      const jobPostContent = $(JOB_CONTENT_SELECTOR).text();
    
      return openaiJobPostAnalyzer(jobPostContent);
    } catch(e) {
      console.log(`Error processing ${STREAK_NAME} job post ${title}`, e);
    }
}

export const streakScrapper: CompanyScrapperFn = async ({ companyId }) => {
  const $ = await fromURL(STREAK_INITIAL_URL);
  const jobPostsElements = $(JOB_POST_SELECTOR);

  const jobPosts: JobPostsListItem[] = jobPostsElements.toArray().map((jobPost) => {
    const url = `${STREAK_DOMAIN}${$(jobPost).attr('href')}`;
    const title = $('.career-filter-listing-text', jobPost).text();
    const id = hash('md5', title); // hash generated from the title because there isn't any job post id

    return {
      id,
      url,
      title,
    };
  });

  const data: ScrappedJobPost[] = [];
  for (let i = 0; i < jobPosts.length; i++) {
    try {
        const jobPost = jobPosts[i];
        console.log(`Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`);
        
        const jobPostData = await scrapJobPost({
          title: jobPost.title,
          url: jobPost.url,
        });

        data.push({
          ...jobPostData,
          originalId: jobPost.id,
          url: jobPost.url,
          companyId,
        });
    } catch (e) {
        console.log(`Error processing ${STREAK_NAME}`, e);
    }
  }

  return data;
}