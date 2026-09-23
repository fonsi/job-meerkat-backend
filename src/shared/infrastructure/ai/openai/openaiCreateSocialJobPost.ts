import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import OpenAI from 'openai';
import {
    buildCompanyPageUrl,
    buildJobPostPageUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';
import { SOCIAL_POST_CONTENT_RULES } from 'social/domain/socialPostContentRules';
import { parseSocialMediaPosts, SocialMediaPosts } from './socialMediaPosts';

export type { SocialMediaPosts };

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

const socialMediaPostsExample: SocialMediaPosts = {
    bluesky: ['bluesky post 1', 'bluesky post 2'],
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
    const jobUrlBluesky = buildJobPostPageUrl(jobPost.slug, UtmSource.Bluesky);
    const jobUrlThreads = buildJobPostPageUrl(jobPost.slug, UtmSource.Threads);
    const companyUrlBluesky = buildCompanyPageUrl(
        company.id,
        UtmSource.Bluesky,
    );
    const companyUrlThreads = buildCompanyPageUrl(
        company.id,
        UtmSource.Threads,
    );
    const jobContext = {
        title: jobPost.title,
        company: company.name,
        location: jobPost.location,
        workplace: jobPost.workplace,
        category: jobPost.category,
        type: jobPost.type,
        salaryRange: jobPost.salaryRange,
    };
    const companyContext = company.description?.trim()
        ? `Internal company context (for you only — rewrite in your own words, never copy-paste): ${company.description.trim()}`
        : 'No company description available.';

    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: {
            type: 'json_object',
        },
        messages: [
            {
                role: 'system',
                content:
                    'You are a community manager with expertise in social media posting for a remote job board.',
            },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `
At Jobmeerkat we listed a job: ${JSON.stringify(jobContext)}.
${companyContext}
${SOCIAL_POST_CONTENT_RULES}
Write plain text only (no HTML/markdown).
Never paste the company description verbatim. Use it only as background to write a fresh, shorter social line.
Two posts. The first post must include the job listing URL. Do not add the Jobmeerkat homepage.

Bluesky and Meta Threads use the same two-post shape. Bluesky: no emojis, hashtags OK if useful, do not hashtag the company name, 300 graphemes per post (prefer ≤280). Threads: max 500 characters per message, max one hashtag, no company-name hashtag.

- Post 1: job hook (title at company, location, salary) and the listing (${jobUrlBluesky} on Bluesky, ${jobUrlThreads} on Threads).
- Post 2: one original sentence about what the company does, plus the company page (${companyUrlBluesky} on Bluesky, ${companyUrlThreads} on Threads).

Return JSON like: ${JSON.stringify(socialMediaPostsExample)}.
`,
                    },
                ],
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
