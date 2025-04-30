import OpenAI from 'openai';
import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';

export type SocialMediaPosts = {
    linkedin: string;
    twitter: string[];
    threads: string[];
};

const OPENAI_MODEL = 'gpt-4o-mini';

const openai = new OpenAI();

const socialMediaPostsExample: SocialMediaPosts = {
    linkedin: 'linkedin post',
    twitter: ['tweet 1', 'tweet 2'],
    threads: ['thread 1', 'thread 2'],
};

type OpenaiSocialMediaPostsCreator = {
    jobPost: JobPost;
    company: Company;
};

export const openaiSocialMediaPostsCreator = async ({
    jobPost,
    company,
}: OpenaiSocialMediaPostsCreator): Promise<SocialMediaPosts> => {
    const companyLink = `https://jobmeerkat.com/company/${company.id}`;
    const jobmeerkatLink = 'https://jobmeerkat.com';

    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: {
            type: 'json_object',
        },
        messages: [
            {
                role: 'system',
                content:
                    'You are a comunity manager with expertise in social media posting.',
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `
                            At Jobmeerkat we have listed a job post with the following data ${JSON.stringify(jobPost)} at the following company: ${company.name}.
                            We are not the ones who offers the job, we just list it. We are a job board that helps people to find job offers.
                            We would like to create a social media post to promote this job offer. Starting with the twitter thread:
                            In the first tweet you can talk about the offer (category, workplace and salary). If any of the data is missing, you can omit it.
                            In the second tweet you can introduce the company: ${company.name}.
                            In third tweet encourage to take a look to the offer details and add the link to the offer (${jobPost.url}).
                            In fourth tweet you can suggest to see more ${company.name} offers at ${companyLink}.
                            And in the fifth tweet you can suggest to explore more job offers at ${jobmeerkatLink} and add some related hastags as #remoteWork, #jobSeach, something related to the job category, etc. Don't add the company name as a hashtag.
                            The content should be adjusted to fit in the character limit.
                            For Meta Threads I want to have a different content than for twitter. I prefer to put all the information in a single message.
                            As Threads messages are limited to 500 characters, you should be careful to not exceed this limit. We can skip the company description and use a more schematic content to show the job offer.
                            And at the end of the message we can add the links to the job offer, the company's jobs link at Jobmeerkat (${companyLink}) and the Jobmeerkat homepage link (${jobmeerkatLink}).
                            And with the same content you can create a linkedin post. As there is no character limit we can include the company description.
                            The response should be a JSON following the example: ${JSON.stringify(socialMediaPostsExample)}.
                        `,
                    },
                ],
            },
        ],
    });

    return JSON.parse(
        completion.choices[0].message.content,
    ) as unknown as SocialMediaPosts;
};
