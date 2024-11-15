import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const FLOAT_NAME = 'float';
export const FLOAT_INITIAL_URL = 'https://www.float.com/careers';

type ScrapJobPostData = {
  id: string;
}

type JobPostsListItem = {
  id: string;
  url: string;
  title: string;
}

const JOB_POST_SELECTOR = '.careers-open-role_card';

const scrapJobPost = async ({ id }: ScrapJobPostData ): Promise<OpenaiJobPost> => {
    try {
      const url = `https://apply.workable.com/api/v2/accounts/floatjobs/jobs/${id}`;
      const response = await fetch(url);
      const jobData = await response.json();
      const publishedDate = jobData.published;
      const descriptionText = jobData.description;
    
      const openaiJobPost = await openaiJobPostAnalyzer(descriptionText);

      if (publishedDate) {
        openaiJobPost.createdAt = new Date(publishedDate).getTime();
      }

      return openaiJobPost;
    } catch(e) {
      console.log(`Error processing Float job post ${id}`, e);
    }
}

export const floatScrapper: CompanyScrapperFn = async ({ companyId }) => {
  const $ = await fromURL(FLOAT_INITIAL_URL);
  const jobPostsElements = $(JOB_POST_SELECTOR);

  const jobPosts: JobPostsListItem[] = jobPostsElements.toArray().map((jobPost) => {
    const url = $(jobPost).attr('href');

    return {
      id: url.split('/').filter(Boolean).pop(),
      url,
      title: $('div[data-text="job"]', jobPost).text()
    };
  });

  const data: ScrappedJobPost[] = [];
  for (let i = 0; i < jobPosts.length; i++) {
    try {
        const jobPost = jobPosts[i];
        console.log(`Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`);
        
        const jobPostData = await scrapJobPost({
          id: jobPost.id,
        });

        data.push({
          ...jobPostData,
          originalId: jobPost.id,
          url: jobPost.url,
          companyId,
        });
    } catch (e) {
        console.log('Error processing Float', e);
    }
  }

  return data;
}