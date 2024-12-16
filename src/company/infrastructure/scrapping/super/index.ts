import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const SUPER_NAME = 'super';
export const SUPER_INITIAL_URL = 'https://jobs.lever.co/super-com';

type ScrapJobPostData = {
  id: string;
  url: string;
}

type JobPostsListItem = {
  id: string;
  url: string;
  title: string;
}

const JOB_POST_SELECTOR = '.posting-title';
const CONTENT_SELECTOR = '.content';

const scrapJobPost = async ({ id, url }: ScrapJobPostData ): Promise<OpenaiJobPost> => {
    try {
      const $ = await fromURL(url);
      const jobPostContent = $(CONTENT_SELECTOR).text();
    
      return openaiJobPostAnalyzer(jobPostContent);
    } catch(e) {
      console.log(`Error processing ${SUPER_NAME} job post ${id}`, e);
    }
}

export const superScrapper: CompanyScrapperFn = async ({ companyId }) => {
  const $ = await fromURL(SUPER_INITIAL_URL);
  const jobPostsElements = $(JOB_POST_SELECTOR);

  const jobPosts: JobPostsListItem[] = jobPostsElements.toArray().map((jobPost) => {
    const url = $(jobPost).attr('href');

    return {
      id: url.split('/').pop(),
      url,
      title: $('h5', jobPost).text()
    };
  });

  const data: ScrappedJobPost[] = [];
  for (let i = 0; i < jobPosts.length; i++) {
    try {
        const jobPost = jobPosts[i];
        console.log(`Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`);
        
        const jobPostData = await scrapJobPost({
          id: jobPost.id,
          url: jobPost.url,
        });

        data.push({
          ...jobPostData,
          originalId: jobPost.id,
          url: jobPost.url,
          companyId,
        });
    } catch (e) {
        console.log(`Error processing ${SUPER_NAME}`, e);
    }
  }

  return data;
}