import { Company } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import OpenAI from 'openai';
import {
    buildCompanyPageUrl,
    buildJobPostPageUrl,
    buildPublicSiteUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';
import { SOCIAL_POST_CONTENT_RULES } from 'social/domain/socialPostContentRules';
import { parseSocialMediaPosts, SocialMediaPosts } from './socialMediaPosts';

export type { SocialMediaPosts };

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

const socialMediaPostsExample: SocialMediaPosts = {
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
    const siteThreads = buildPublicSiteUrl(UtmSource.Threads);
    const jobPostForPrompt: JobPost = {
        ...jobPost,
        url: buildJobPostPageUrl(jobPost.slug, UtmSource.Social),
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
At Jobmeerkat we listed a job post with data ${JSON.stringify(jobPostForPrompt)} at company ${company.name}.
${companyContext}
${SOCIAL_POST_CONTENT_RULES}
Write plain text only (no HTML/markdown).
Never paste the company description verbatim. Use it only as background to write a fresh, shorter social line.

Bluesky:
- Prefer a SINGLE post (array length 1) with role, company, salary if available, and the listing link ${jobUrlBluesky}.
- Optionally include company page ${companyUrlBluesky}.
- Only use a 2-post thread if salary + links cannot fit.
- No emojis. Hashtags OK if useful; do not hashtag the company name.
- Hard limit 300 graphemes per post (prefer ≤280).

Meta Threads:
- Message 1: job hook (title at company, location, salary) + note that the listing link is in the thread + link to Jobmeerkat ${siteThreads}. Max one hashtag. No company-name hashtag.
- Message 2: one original sentence about what the company does (paraphrase from context; do not quote it) + company page ${companyUrlThreads}.
- Message 3: job listing details link ${jobUrlThreads}.
- Max 500 characters per message.

Return JSON like: ${JSON.stringify(socialMediaPostsExample)}.
`,
                    },
                ],
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
