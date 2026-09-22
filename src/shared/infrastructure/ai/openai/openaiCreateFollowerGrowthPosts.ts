import OpenAI from 'openai';
import { FollowerGrowthContent } from 'social/domain/followerGrowthContent';
import { FollowerGrowthDataset } from 'social/application/followerGrowthDataResolver';
import { FollowerGrowthPlan } from 'social/domain/followerGrowthPlan';
import {
    FollowerGrowthPosts,
    parseFollowerGrowthPosts,
} from './followerGrowthPosts';

const OPENAI_MODEL = 'gpt-6-luna';
const openai = new OpenAI();

type CreateFollowerGrowthPostsInput = {
    plan: FollowerGrowthPlan;
    dataset: FollowerGrowthDataset;
    history: FollowerGrowthContent[];
    excludedTopicKeys?: string[];
};

const example = {
    family: 'salaryIntelligence',
    topicKey: 'backend-usd-salary-ceiling',
    summary: 'How current backend salary ceilings compare with the wider data.',
    evidenceIds: ['dataset', 'salary-usd', 'categories'],
    posts: {
        bluesky: ['post 1', 'post 2'],
        threads: ['post 1', 'post 2'],
        x: ['post 1', 'post 2'],
        linkedin: ['one native LinkedIn post'],
    },
};

export const openaiCreateFollowerGrowthPosts = async ({
    plan,
    dataset,
    history,
    excludedTopicKeys = [],
}: CreateFollowerGrowthPostsInput): Promise<FollowerGrowthPosts> => {
    const historyForPrompt = [...history]
        .sort((a, b) => b.generatedAt - a.generatedAt)
        .slice(0, 100)
        .map(({ generatedAt, family, topicKey, summary }) => ({
            date: new Date(generatedAt).toISOString().slice(0, 10),
            family,
            topicKey,
            summary,
        }));
    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                    'You are Jobmeerkat’s data editor. You create useful, credible social content for remote job seekers from supplied Jobmeerkat listing data.',
            },
            {
                role: 'user',
                content: `
Create one follower-growth social package.

Approved editorial plan: ${JSON.stringify(plan)}
Retrieved Jobmeerkat evidence: ${JSON.stringify(dataset)}
Previously generated content to avoid repeating: ${JSON.stringify(historyForPrompt)}
Explicitly excluded topic keys: ${JSON.stringify(excludedTopicKeys)}

Rules:
- Follow the approved family and angle. Do not substitute another topic.
- Use only facts present in the retrieved evidence and cite every factual basis through evidenceIds.
- Describe the dataset as Jobmeerkat's current listings. Never imply a market-wide or longitudinal trend.
- Do not invent percentages, causes, candidate outcomes, employer intent, or facts absent from the evidence.
- Advice may be evergreen, but it must be clearly tied to an observed listing, requirement, salary, category, job type, or location pattern in the snapshot.
- Pick a materially different angle from every prior summary and topicKey.
- topicKey must be a stable, concise kebab-case description of the angle, not a date or random identifier.
- Write for job seekers. Lead with a useful or surprising observation, explain it, give a concrete action, and end with a narrow discussion prompt when natural.
- Do not include URLs, promotional calls to action, or claims that Jobmeerkat is the employer.
- Keep each post understandable in its thread order; do not add thread numbering unless it improves clarity.
- Bluesky: 2-5 posts, no emojis, no hashtags, maximum 300 graphemes each.
- Threads: 2-5 conversational posts, maximum 500 characters each, maximum one hashtag across the thread.
- X: 2-5 concise posts, maximum 280 characters each, maximum one hashtag across the thread.
- LinkedIn: exactly one native standalone post, maximum 3000 characters; use short paragraphs, not a reply-thread format.
- summary must be a plain 1-280 character description used to prevent future repetition.
- evidenceIds must contain only IDs from retrieved evidence and include every item used to support the content.

Return JSON matching this shape: ${JSON.stringify(example)}
`,
            },
        ],
    });

    return parseFollowerGrowthPosts(
        completion.choices[0].message.content,
        dataset,
        plan.family,
    );
};
