import OpenAI from 'openai';
import { Company } from 'company/domain/company';
import { getPublicSiteBaseUrl } from 'shared/infrastructure/url/buildJobPostPageUrl';
import {
    cleanUrlsInObject,
    SocialMediaPosts,
} from 'shared/infrastructure/ai/openai/openaiCreateSocialJobPost';
import { SOCIAL_POST_CONTENT_RULES } from 'social/domain/socialPostContentRules';

const OPENAI_MODEL = 'gpt-4o-mini';
const openai = new OpenAI();

export type CompanyThreadJobSummary = {
    title: string;
    salaryLabel: string;
    jobUrl: string;
};

const example: SocialMediaPosts = {
    linkedin: 'linkedin post',
    twitter: ['tweet 1'],
    bluesky: ['bluesky 1', 'bluesky 2'],
    threads: ['thread 1', 'thread 2', 'thread 3'],
};

export const openaiCreateCompanyThreadPosts = async ({
    company,
    openCount,
    jobs,
}: {
    company: Company;
    openCount: number;
    jobs: CompanyThreadJobSummary[];
}): Promise<SocialMediaPosts> => {
    const site = getPublicSiteBaseUrl();
    const companyLink = `${site}/company/${company.id}`;

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
Create a company spotlight thread.
Company: ${company.name}
Homepage: ${company.homePage}
Internal company context (for you only — rewrite in your own words, never copy-paste): ${company.description ?? 'n/a'}
Open remote roles with public salary (USD/EUR) on Jobmeerkat: ${openCount}
Sample roles: ${JSON.stringify(jobs)}
Company page: ${companyLink}
Site: ${site}

${SOCIAL_POST_CONTENT_RULES}
Never paste the company description verbatim. Paraphrase into short social copy.
Keep salaries in USD/EUR as given.

X: optional single tweet (may be unused). ≤280 chars.
Bluesky: 1–2 posts with an original company hook + ${companyLink}. ≤300 graphemes (prefer ≤280).
Threads: 2–3 messages — original one-liner on what they do, open roles / sample salaries, link ${companyLink}. ≤500 chars. Max one hashtag.

LinkedIn: one spotlight post written from scratch (paraphrase only).

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return cleanUrlsInObject(
        JSON.parse(completion.choices[0].message.content),
    ) as SocialMediaPosts;
};
