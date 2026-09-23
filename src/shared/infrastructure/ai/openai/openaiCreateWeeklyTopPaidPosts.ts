import OpenAI from 'openai';
import {
    buildPublicSiteUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';
import {
    parseSocialMediaPosts,
    SocialMediaPosts,
} from 'shared/infrastructure/ai/openai/socialMediaPosts';
import { DailyAnalysisJobSummary } from 'shared/infrastructure/ai/openai/openaiCreateDailyAnalysisPosts';
import { SOCIAL_POST_CONTENT_RULES } from 'social/domain/socialPostContentRules';

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

const example: SocialMediaPosts = {
    bluesky: ['bluesky 1', 'bluesky 2'],
    threads: ['thread 1', 'thread 2', 'thread 3'],
};

export const openaiCreateWeeklyTopPaidPosts = async ({
    topJobs,
}: {
    topJobs: DailyAnalysisJobSummary[];
}): Promise<SocialMediaPosts> => {
    const siteBluesky = buildPublicSiteUrl(UtmSource.Bluesky);
    const siteThreads = buildPublicSiteUrl(UtmSource.Threads);

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
${SOCIAL_POST_CONTENT_RULES}
Salaries are USD or EUR only — keep each amount in its given currency.
When including listing links from the data, keep their query strings.

Bluesky: 1–2 posts. Hook + 2–3 standout salaries, then ${siteBluesky}. No emojis. ≤300 graphemes (prefer ≤280).
Threads: 2–3 messages listing the top roles with salaries and listing links where useful, ending with ${siteThreads}. ≤500 chars. Max one hashtag.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
