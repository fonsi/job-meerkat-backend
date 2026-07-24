import OpenAI from 'openai';
import { getPublicSiteBaseUrl } from 'shared/infrastructure/url/buildJobPostPageUrl';
import {
    cleanUrlsInObject,
    SocialMediaPosts,
} from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { DailyAnalysisJobSummary } from 'shared/infrastructure/ai/openai/openaiCreateDailyAnalysisPosts';
import { SOCIAL_POST_CONTENT_RULES } from 'social/domain/socialPostContentRules';

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

const example: SocialMediaPosts = {
    linkedin: 'linkedin post',
    twitter: ['tweet 1', 'tweet 2'],
    bluesky: ['bluesky 1', 'bluesky 2'],
    threads: ['thread 1', 'thread 2', 'thread 3'],
};

export const openaiCreateWeeklyTopPaidPosts = async ({
    topJobs,
}: {
    topJobs: DailyAnalysisJobSummary[];
}): Promise<SocialMediaPosts> => {
    const site = getPublicSiteBaseUrl();

    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                    'You write concise social posts for Jobmeerkat, a remote job board with public salaries.',
            },
            {
                role: 'user',
                content: `
Create a weekly "top paid remote jobs" roundup from: ${JSON.stringify(topJobs)}.
Site: ${site}.
${SOCIAL_POST_CONTENT_RULES}
Salaries are USD or EUR only — keep each amount in its given currency.

X: 1–2 tweets. Hook + 2–3 standout salaries, then ${site}. No emojis. ≤280 chars.
Bluesky: similar, ≤300 graphemes (prefer ≤280), 1–2 posts.
Threads: 2–3 messages listing the top roles with salaries and listing links where useful, ending with ${site}. ≤500 chars. Max one hashtag.
LinkedIn: one roundup post.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return cleanUrlsInObject(
        JSON.parse(completion.choices[0].message.content),
    ) as SocialMediaPosts;
};
