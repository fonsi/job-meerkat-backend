import OpenAI from 'openai';
import {
    buildPublicSiteUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';
import {
    parseSocialMediaPosts,
    SocialMediaPosts,
} from 'shared/infrastructure/ai/openai/socialMediaPosts';
import { SOCIAL_POST_CONTENT_RULES } from 'social/domain/socialPostContentRules';

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

export type DailyAnalysisJobSummary = {
    title: string;
    companyName: string;
    salaryLabel: string;
    category: string;
    jobUrl: string;
};

export type DailyAnalysisStats = {
    jobCount: number;
    companyCount: number;
    medianSalaryLabel: string | null;
    maxSalaryLabel: string | null;
    topCategories: string[];
    topJobs: DailyAnalysisJobSummary[];
};

const example: SocialMediaPosts = {
    bluesky: ['bluesky 1', 'bluesky 2'],
    threads: ['thread 1', 'thread 2'],
};

export const openaiCreateDailyAnalysisPosts = async (
    stats: DailyAnalysisStats,
): Promise<SocialMediaPosts> => {
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
Create a "daily new jobs" analysis post from this data: ${JSON.stringify(stats)}.
${SOCIAL_POST_CONTENT_RULES}
Salaries in this dataset are USD or EUR only — keep amounts in their given currency.
When including listing links from the data, keep their query strings.

Bluesky: 1–2 posts max (prefer 1 if it fits). Lead with a data hook (count, salary median/max). Include ${siteBluesky}. No emojis. ≤300 graphemes (prefer ≤280).
Threads: 2 messages — (1) the daily hook + invite to browse listings on ${siteThreads}; (2) highlight 1–2 top paid roles with salary and encourage following for more. ≤500 chars. Max one hashtag total.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
