import OpenAI from 'openai';
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
    const [lead, ...otherJobs] = stats.topJobs;
    const promptStats = {
        ...stats,
        topJobs: [
            lead
                ? {
                      title: lead.title,
                      companyName: lead.companyName,
                      salaryLabel: lead.salaryLabel,
                      category: lead.category,
                      jobUrl: lead.jobUrl,
                  }
                : null,
            ...otherJobs.map(
                ({ title, companyName, salaryLabel, category }) => ({
                    title,
                    companyName,
                    salaryLabel,
                    category,
                }),
            ),
        ].filter((job) => job != null),
    };

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
Create a "daily new jobs" analysis post from this data: ${JSON.stringify(promptStats)}.
${SOCIAL_POST_CONTENT_RULES}
Salaries in this dataset are USD or EUR only — keep amounts in their given currency.
The first post links the lead role's jobUrl. Do not link the other roles or the Jobmeerkat homepage.

Bluesky and Threads use the same two-post shape. Bluesky: no emojis, ≤300 graphemes per post (prefer ≤280). Threads: ≤500 chars, max one hashtag total.

- Post 1: the daily hook (count, salary median/max) and the lead listing link.
- Post 2: other standout salaries, no URL.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
