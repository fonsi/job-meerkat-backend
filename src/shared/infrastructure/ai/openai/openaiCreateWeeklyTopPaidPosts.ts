import OpenAI from 'openai';
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
    threads: ['thread 1', 'thread 2'],
};

export const openaiCreateWeeklyTopPaidPosts = async ({
    topJobs,
}: {
    topJobs: DailyAnalysisJobSummary[];
}): Promise<SocialMediaPosts> => {
    const roles = topJobs.slice(0, 3).map((job, index) =>
        index === 0
            ? job
            : {
                  title: job.title,
                  companyName: job.companyName,
                  salaryLabel: job.salaryLabel,
                  category: job.category,
              },
    );

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
Create a weekly "top paid remote jobs" roundup from: ${JSON.stringify(roles)}.
${SOCIAL_POST_CONTENT_RULES}
Salaries are USD or EUR only — keep each amount in its given currency.
The first post links the first role's jobUrl. Mention the other salaries with no extra URL. Do not add the Jobmeerkat homepage.

Bluesky and Threads use the same two-post shape. Bluesky: no emojis, ≤300 graphemes per post (prefer ≤280). Threads: ≤500 chars, max one hashtag.

- Post 1: hook and the lead listing link.
- Post 2: the other roles and salaries, no URL.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
