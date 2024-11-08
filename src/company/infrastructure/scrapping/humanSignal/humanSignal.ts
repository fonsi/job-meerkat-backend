import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const HUMAN_SIGNAL_NAME = 'HumanSignal';
export const HUMAN_SIGNAL_INITIAL_URL = 'https://humansignal.com/careers/';

type ScrapJobPostData = {
  id: string;
  url: string;
}

type JobPostsListItem = {
  id: string;
  url: string;
  title: string;
}

const JOB_POST_SELECTOR = '.CareersListCardTitle';
const JOB_HEADER_SELECTOR = '#header';
const JOB_TITLE_SELECTOR = '#content';

const scrapJobPost = async ({ id, url }: ScrapJobPostData ): Promise<OpenaiJobPost> => {
    try {
      const $ = await fromURL(url);
  
      const tagsText = $(JOB_HEADER_SELECTOR).text();
      const titleText = $(JOB_TITLE_SELECTOR).text();
      const jobPostContent = `${tagsText} ${titleText}`;
    
      return openaiJobPostAnalyzer(jobPostContent);
    } catch(e) {
      console.log(`Error processing ${HUMAN_SIGNAL_NAME} job post ${id}`, e);
    }
}

export const humanSignalScrapper: CompanyScrapperFn = async ({ companyId }) => {
  const $ = await fromURL(HUMAN_SIGNAL_INITIAL_URL);
  const jobPostsElements = $(JOB_POST_SELECTOR);

  const jobPosts: JobPostsListItem[] = jobPostsElements.toArray().map((jobPost) => {
    const url = $(jobPost).attr('href');

    return {
      id: url.split('/').filter(Boolean).pop(),
      url,
      title: $(jobPost).text()
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
        console.log(`Error processing ${HUMAN_SIGNAL_NAME}`, e);
    }
  }

  return data;
}