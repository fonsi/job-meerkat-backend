import { CompanyScrapperFn, ScrappedJobPost } from '../companyScrapper';
import { OpenaiJobPost, openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

export const REC_ROOM_NAME = 'rec room';
export const REC_ROOM_INITIAL_URL = 'https://boards-api.greenhouse.io/v1/boards/recroom/jobs?content=true';

type ScrapJobPostData = {
  id: number;
  content: string;
}

type JobPostsListItem = {
  id: number;
  url: string;
  title: string;
  content: string;
  createdAt: number;
  location: string;
}

const scrapJobPost = async ({ id, content }: ScrapJobPostData ): Promise<OpenaiJobPost> => {
    try {    
      return openaiJobPostAnalyzer(content);
    } catch(e) {
      console.log(`Error processing ${REC_ROOM_NAME} job post ${id}`, e);
    }
}

export const recRoomScrapper: CompanyScrapperFn = async ({ companyId }) => {
  const response = await fetch(REC_ROOM_INITIAL_URL);
  const jobsData = await response.json();

  const jobPosts: JobPostsListItem[] = [];

  jobsData.jobs.forEach((jobData) => {
    const url = jobData.absolute_url;

    jobPosts.push({
      id: jobData.internal_job_id,
      url,
      title: jobData.title,
      createdAt: new Date(jobData.updated_at).getTime(),
      content: jobData.content,
      location: jobData.location?.name,
    });
  });

  const data: ScrappedJobPost[] = [];
  for (let i = 0; i < jobPosts.length; i++) {
    try {
        const jobPost = jobPosts[i];
        console.log(`Analyzing: "${jobPost.title}" (${i + 1} / ${jobPosts.length})`);
        
        const jobPostData = await scrapJobPost({
          id: jobPost.id,
          content: jobPost.content,
        });

        data.push({
          ...jobPostData,
          originalId: jobPost.id.toString(),
          url: jobPost.url,
          companyId,
          createdAt: jobPost.createdAt,
          location: jobPost.location || jobPostData.location,
        });
    } catch (e) {
        console.log(`Error processing ${REC_ROOM_NAME}`, e);
    }
  }

  return data;
}