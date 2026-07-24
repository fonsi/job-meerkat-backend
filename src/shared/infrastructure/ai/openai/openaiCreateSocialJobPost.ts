import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import OpenAI from 'openai';
import {
    buildJobPostPageUrl,
    getPublicSiteBaseUrl,
} from 'shared/infrastructure/url/buildJobPostPageUrl';
import { SOCIAL_POST_CONTENT_RULES } from 'social/domain/socialPostContentRules';

export type SocialMediaPosts = {
    linkedin: string;
    twitter: string[];
    bluesky: string[];
    threads: string[];
};

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

export const cleanUrlsInObject = (obj: unknown): unknown => {
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
    twitter: ['tweet 1'],
    bluesky: ['bluesky post 1', 'bluesky post 2'],
    threads: ['thread 1', 'thread 2', 'thread 3'],
};

type OpenaiSocialMediaPostsCreator = {
    jobPost: JobPost;
    company: Company;
};

export const openaiSocialMediaPostsCreator = async ({
    jobPost,
    company,
}: OpenaiSocialMediaPostsCreator): Promise<SocialMediaPosts> => {
    const baseUrl = getPublicSiteBaseUrl();
    const companyLink = `${baseUrl}/company/${company.id}`;
    const jobmeerkatLink = baseUrl;
    const jobPageUrl = buildJobPostPageUrl(jobPost.slug);
    const jobPostForPrompt: JobPost = { ...jobPost, url: jobPageUrl };
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
At Jobmeerkat we listed a job post with data ${JSON.stringify(jobPostForPrompt)} at company ${company.name}.
${companyContext}
${SOCIAL_POST_CONTENT_RULES}
Write plain text only (no HTML/markdown).
Never paste the company description verbatim. Use it only as background to write a fresh, shorter social line.

X / Twitter:
- Prefer a SINGLE tweet (array length 1) with role, company, salary if available, and the listing link ${jobPageUrl}.
- Only use a 2-tweet thread if salary + links cannot fit in 280 characters.
- No emojis. Hashtags OK if useful; do not hashtag the company name.
- Hard limit 280 characters per tweet.

Bluesky:
- Same angle as X, hard limit 300 graphemes per post (prefer ≤280). 1–2 posts is fine.
- Include job listing ${jobPageUrl} and optionally company page ${companyLink}.

Meta Threads (different from X):
- Message 1: job hook (title at company, location, salary) + note that the listing link is in the thread + link to Jobmeerkat ${jobmeerkatLink}. Max one hashtag. No company-name hashtag.
- Message 2: one original sentence about what the company does (paraphrase from context; do not quote it) + company page ${companyLink}.
- Message 3: job listing details link ${jobPageUrl}.
- Max 500 characters per message.

LinkedIn: one longer professional post with the available facts and ${jobPageUrl}.

Return JSON like: ${JSON.stringify(socialMediaPostsExample)}.
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
