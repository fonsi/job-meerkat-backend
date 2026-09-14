import OpenAI from 'openai';
import { Company } from 'company/domain/company';
import {
    buildCompanyPageUrl,
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

export type CompanyThreadJobSummary = {
    title: string;
    salaryLabel: string;
    jobUrl: string;
};

const example: SocialMediaPosts = {
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
    const companyUrlBluesky = buildCompanyPageUrl(
        company.id,
        UtmSource.Bluesky,
    );
    const companyUrlThreads = buildCompanyPageUrl(
        company.id,
        UtmSource.Threads,
    );
    const siteBluesky = buildPublicSiteUrl(UtmSource.Bluesky);

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
Site: ${siteBluesky}

${SOCIAL_POST_CONTENT_RULES}
Never paste the company description verbatim. Paraphrase into short social copy.
Keep salaries in USD/EUR as given.
When linking sample roles, keep the jobUrl from the sample data and do not strip query strings.

Bluesky: 1–2 posts with an original company hook + ${companyUrlBluesky}. ≤300 graphemes (prefer ≤280).
Threads: 2–3 messages — original one-liner on what they do, open roles / sample salaries, link ${companyUrlThreads}. ≤500 chars. Max one hashtag.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
