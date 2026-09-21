import OpenAI from 'openai';
import { Company } from 'company/domain/company';
import {
    buildCompanyPageUrl,
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
    bluesky: ['bluesky 1', 'bluesky 2', 'bluesky 3'],
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
    const [lead, ...otherJobs] = jobs;
    const sampleRoles = [
        lead
            ? {
                  title: lead.title,
                  salaryLabel: lead.salaryLabel,
                  jobUrl: lead.jobUrl,
              }
            : null,
        ...otherJobs.map(({ title, salaryLabel }) => ({ title, salaryLabel })),
    ].filter((role) => role != null);

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
Internal company context (for you only — rewrite in your own words, never copy-paste): ${company.description ?? 'n/a'}
Open remote roles with public salary (USD/EUR) on Jobmeerkat: ${openCount}
Sample roles: ${JSON.stringify(sampleRoles)}

${SOCIAL_POST_CONTENT_RULES}
Never paste the company description verbatim. Paraphrase into short social copy.
Keep salaries in USD/EUR as given.
The first post links the lead role's jobUrl. The second links the company page. Do not link other roles, the company website, or the Jobmeerkat homepage.

Bluesky and Threads use the same shape. Bluesky: ≤300 graphemes per post (prefer ≤280). Threads: ≤500 chars, max one hashtag.

- Post 1: lead role and its listing link (the lead jobUrl).
- Post 2: what they do, plus the company page (${companyUrlBluesky} on Bluesky, ${companyUrlThreads} on Threads).
- Post 3: other open roles and salaries, no URL.

Return JSON: ${JSON.stringify(example)}.
`,
            },
        ],
    });

    return parseSocialMediaPosts(completion.choices[0].message.content);
};
