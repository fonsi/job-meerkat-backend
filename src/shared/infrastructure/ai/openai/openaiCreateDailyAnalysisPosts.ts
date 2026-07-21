import OpenAI from 'openai';
import { getPublicSiteBaseUrl } from 'shared/infrastructure/url/buildJobPostPageUrl';
import {
    cleanUrlsInObject,
    SocialMediaPosts,
} from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';

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
    linkedin: 'linkedin post',
    twitter: ['tweet 1', 'tweet 2'],
    bluesky: ['bluesky 1', 'bluesky 2'],
    threads: ['thread 1', 'thread 2'],
};

export const openaiCreateDailyAnalysisPosts = async (
    stats: DailyAnalysisStats,
): Promise<SocialMediaPosts> => {
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
Create a "daily new jobs" analysis post from this data: ${JSON.stringify(stats)}.
Jobmeerkat site: ${site}. We are a job board, not the employer.

X / Twitter: 1–2 tweets max (prefer 1 if it fits). Lead with a data hook (count, salary median/max). Include ${site}. No emojis. ≤280 chars each.
Bluesky: similar to X, ≤299 chars, 1–2 posts.
Threads: 2 messages — (1) the daily hook + invite to browse ${site}; (2) highlight 1–2 top paid roles with salary and encourage following for more. ≤500 chars. Max one hashtag total.
LinkedIn: one short professional update with the key numbers and ${site}.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return cleanUrlsInObject(
        JSON.parse(completion.choices[0].message.content),
    ) as SocialMediaPosts;
};
