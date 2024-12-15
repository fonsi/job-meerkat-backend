import { fromURL } from 'cheerio';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const FEELD_NAME = 'feeld';
export const FEELD_INITIAL_URL = 'https://feeld.co/careers';

type ScrapJobPostData = {
  id: string;
  url: string;
}

type JobPostsListItem = {
  id: string;
  url: string;
  title: string;
}

type ScrappedJobPostResponse = {
  openaiJobPost: OpenaiJobPost;
  id: string;
  url: string;
}

const JOB_POST_SELECTOR = '#jobs-list article';

const scrapJobPost = async ({ id, url }: ScrapJobPostData ): Promise<ScrappedJobPostResponse> => {
    try {
      const $ = await fromURL(url);
      const realUrl = $('link[rel="alternate"]').attr('href');
      const realId = realUrl.split('/').pop();
      const jsonUrl = `https://apply.workable.com/api/v2/accounts/feeldco/jobs/${realId}`;
      const response = await fetch(jsonUrl);
      const jobData = await response.json() as Record<string, unknown>;
      const publishedDate = jobData.published as string;

      const openaiJobPost = await openaiJobPostAnalyzer(JSON.stringify(jobData));

      if (publishedDate) {
        openaiJobPost.createdAt = new Date(publishedDate).getTime();
      }

      return {
        openaiJobPost,
        id: realId,
        url: realUrl,
      }
    } catch(e) {
      console.log(`Error processing ${FEELD_NAME} job post ${id}`, e);
    }
}

export const feeldScrapper: CompanyScrapperFn = async ({ companyId }) => {
  const $ = await fromURL(FEELD_INITIAL_URL);
  const jobPostsElements = $(JOB_POST_SELECTOR);

  const jobPosts: JobPostsListItem[] = jobPostsElements.toArray().map((jobPost) => {
    const url = $('a', jobPost).attr('href');

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
          id: jobPost.id,
          url: jobPost.url,
        });

        data.push({
          ...jobPostData.openaiJobPost,
          title: jobPost.title,
          originalId: jobPostData.id,
          url: jobPostData.url,
          companyId,
        });
    } catch (e) {
        console.log(`Error processing ${FEELD_NAME}`, e);
    }
  }

  return data;
}