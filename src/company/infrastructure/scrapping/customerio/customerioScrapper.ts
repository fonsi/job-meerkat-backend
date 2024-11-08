import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const CUSTOMERIO_NAME = 'customer.io';
export const CUSTOMERIO_INITIAL_URL = 'https://job-boards.greenhouse.io/customerio';

type ScrapJobPostData = {
  url: string;
}

type JobPostsListItem = {
  id: string;
  url: string;
  title: string;
}

const JOB_POST_SELECTOR = '.job-post a';
const JOB_TAGS_SELECTOR = '.job__tags';
const JOB_TITLE_SELECTOR = '.job__title';
const JOB_DESCRIPTION_SELECTOR = '.job__description';

const scrapJobPost = async ({ url }: ScrapJobPostData ): Promise<OpenaiJobPost> => {
    const $ = await fromURL(url);
  
    const tagsText = $(JOB_TAGS_SELECTOR).text();
    const titleText = $(JOB_TITLE_SELECTOR).text();
    const descriptionText = $(JOB_DESCRIPTION_SELECTOR).text();
    const jobPostContent = `${tagsText} ${titleText} ${descriptionText}`;
  
    return openaiJobPostAnalyzer(jobPostContent);
}

export const customerioScrapper: CompanyScrapperFn = async ({ companyId }) => {
  const $ = await fromURL(CUSTOMERIO_INITIAL_URL);
  const jobPostsElements = $(JOB_POST_SELECTOR);

  const jobPosts: JobPostsListItem[] = jobPostsElements.toArray().map((jobPost) => {
    const url = $(jobPost).attr('href');

    return {
      id: url.split('/').pop(),
      url,
      title: $('p', jobPost).first().text()
    };
  });

  const data: ScrappedJobPost[] = [];
  for (let i = 0; i < jobPosts.length; i++) {
    try {
        const jobPost = jobPosts[i];
        console.log(`Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`);
        
        const jobPostData = await scrapJobPost({
          url: jobPost.url,
        });

        data.push({
          ...jobPostData,
          originalId: jobPost.id,
          url: jobPost.url,
          companyId,
        });
    } catch (e) {
        console.log('Error processing job post', e);
    }
  }

  return data;
}