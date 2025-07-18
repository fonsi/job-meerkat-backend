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

const cleanUrlsInObject = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
        return obj.replace(/(https?:\/\/[^\s]+)\.(?=[\s"}]|$)/g, '$1');
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => cleanUrlsInObject(item));
    }
    if (typeof obj === 'object' && obj !== null) {
        const cleaned: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
            cleaned[key] = cleanUrlsInObject(value);
        }
        return cleaned;
    }
    return obj;
};

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
                            We are not the ones who offers the job, we just list it. Be sure not to say that you are the ones who offers the job or we are hiring. We are a job board that helps people to find job offers.
                            We would like to create a social media post to promote this job offer.
                            The messages should be written in plain text. You can't use HTML or markdown.
                            Starting with the twitter thread:
                            I want to publish a thread with 2 tweets.
                            The first with the job offer description (category, workplace and salary). Be sure to mention the company name. Do not use icons or emojis.
                            The second with the link to the job offer (${jobPost.url}), a link to the company's page at Jobmeerkat where viewers can discover more company's open job posts: ${companyLink} and a link to Jobmeerkat (${jobmeerkatLink}) encouraging users to visit for more job posts.
                            ${
                                ''
                                /*In the first tweet you can talk about the offer (category, workplace and salary). If any of the data is missing, you can omit it.
                                In the second tweet you can introduce the company: ${company.name}.
                                In third tweet encourage to take a look to the offer details and add the link to the offer (${jobPost.url}).
                                In fourth tweet you can suggest to see more ${company.name} offers at ${companyLink}.
                                And in the fifth tweet you can suggest to explore more job offers at ${jobmeerkatLink} and add some related hastags as #remoteWork, #jobSeach, something related to the job category, etc. Don't add the company name as a hashtag.*/
                            }
                            Try to add some hashtags to the content if you think are relevant or can help to reach more people. Don't add the company name as a hashtag.
                            The content should be adjusted to fit in the 280 character limit.
                            For Meta Threads I want to have different content than for twitter. In the first message I prefer to put the job post description (with location and salary, if available) and in a next line a text indicating that the job offer link is inside the thread. Be sure to mention the company name. Then, in another line, don't forget to add a text and the link to Jobmeerkat (${jobmeerkatLink}) encouraging users to visit for more job posts.
                            In the second message we can add the company's description with the link to the company's page at Jobmeerkat where viewers can discover more company's open job posts: ${companyLink}.
                            And in the third link we can finally add the link to the job post where the viewer can get more details and apply: ${jobPost.url}.
                            As Threads messages are limited to 500 characters, you should be careful to not exceed this limit.
                            For Linkedin we can use all the available information to create a post.
                            The response should be a JSON following the example: ${JSON.stringify(socialMediaPostsExample)}.
                        `,
                    },
                ],
            },
        ],
    });

    const rawContent = completion.choices[0].message.content;
    const parsedContent = JSON.parse(rawContent);
    const cleanedContent = cleanUrlsInObject(parsedContent);

    return cleanedContent as SocialMediaPosts;
};
