import { Browser, ElementHandle } from 'puppeteer';
import { scrap } from 'shared/infrastructure/scrapping/puppeter/puppeterScrapper';
import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const CUSTOMERIO_NAME = 'customer.io';
export const CUSTOMERIO_INITIAL_URL = 'https://job-boards.greenhouse.io/customerio';

type ScrapJobPostData = {
  browser: Browser;
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

const scrapJobPost = async ({ browser, url }: ScrapJobPostData ): Promise<OpenaiJobPost> => {
    const offerPage = await browser.newPage();
    await offerPage.goto(url);
    await offerPage.waitForSelector(JOB_DESCRIPTION_SELECTOR);
  
    const tagsText = await (await offerPage.$(JOB_TAGS_SELECTOR)).evaluate(element => element.textContent);
    const titleText = await (await offerPage.$(JOB_TITLE_SELECTOR)).evaluate(element => element.textContent);
    const descriptionText = await (await offerPage.$(JOB_DESCRIPTION_SELECTOR)).evaluate(element => element.textContent);
    const jobPostContent = `${tagsText} ${titleText} ${descriptionText}`;
  
    return openaiJobPostAnalyzer(jobPostContent);
}

export const customerioScrapper: CompanyScrapperFn = ({ companyId }) => {
  const scrapProcess = async ({ browser, page}) => {
    await page.waitForSelector(JOB_POST_SELECTOR);

    const jobPostsElements: Array<ElementHandle<HTMLAnchorElement>> = await page.$$(JOB_POST_SELECTOR);

    const jobPostsPromises: Array<Promise<JobPostsListItem>> = jobPostsElements.map((jobPost) => {
      return new Promise(async (resolve) => {
        const { id, url, title } = await jobPost.evaluate((jobPostElement): JobPostsListItem => {
          const url = jobPostElement.href;

          return {
              id: url.split('/').pop(),
              url,
              title: jobPostElement.querySelector('p').textContent,
          };
        });

        resolve({
            id,
            url,
            title,
        });
      });
    });

    const jobPosts = await Promise.all(jobPostsPromises);

    const data: ScrappedJobPost[] = [];
    for (let i = 0; i < jobPosts.length; i++) {
      try {
          const jobPost = jobPosts[i];
          console.log(`Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`);
          
          const jobPostData = await scrapJobPost({
            browser,
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

  return scrap<ScrappedJobPost[]>({ scrapProcess, initialUrl: CUSTOMERIO_INITIAL_URL });
}