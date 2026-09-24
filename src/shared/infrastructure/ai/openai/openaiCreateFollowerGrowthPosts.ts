import OpenAI from 'openai';
import { FollowerGrowthContent } from 'social/domain/followerGrowthContent';
import { FollowerGrowthDataset } from 'social/application/followerGrowthDataResolver';
import { FollowerGrowthPlan } from 'social/domain/followerGrowthPlan';
import {
    BLUESKY_MAX_GRAPHEMES,
    LINKEDIN_MAX_CHARACTERS,
    THREADS_MAX_CHARACTERS,
    X_MAX_CHARACTERS,
} from 'social/domain/socialPostLimits';
import {
    FollowerGrowthPosts,
    LINKEDIN_MIN_CHARACTERS,
    MAX_THREAD_POSTS,
    MIN_THREAD_POSTS,
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
        bluesky: ['post 1', 'post 2', 'post 3', 'post 4', 'post 5'],
        threads: ['post 1', 'post 2', 'post 3', 'post 4', 'post 5'],
        x: ['post 1', 'post 2', 'post 3', 'post 4', 'post 5'],
        linkedin: ['one reflective LinkedIn essay of 1500-3000 characters'],
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
                    'You are Jobmeerkat’s data editor. You write dense, reflective social content for remote job seekers from supplied Jobmeerkat listing data.',
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
- Follow the approved family, readerProblem, editorialThesis, readerValue, and evidenceRole. Do not substitute another topic.
- Write for remote job seekers who recognize the approved readerProblem across professions and locations. Every paragraph or thread post must advance the editorialThesis or deliver the readerValue.
- Keep specificity in the shared problem, not the reader’s country, profession, category, company, or demographic. Treat any such detail in the evidence as an example, not the target audience.
- Never suggest exploring an unrelated category because it has more listings.
- Use only facts present in the retrieved evidence. Record the supporting evidence ids in evidenceIds. Never write an evidence id, request-N, or a bracket citation in a post, summary, or topicKey.
- Scope factual claims to the supplied snapshot. Mention Jobmeerkat at most once, and only when the source is needed to prevent a market-wide interpretation. Jobmeerkat must not be the subject of the post.
- Do not invent percentages, causes, candidate outcomes, employer intent, or facts absent from the evidence.
- Advice may be broadly applicable, but it must be supported by an observed listing, requirement, salary, category, job type, or location pattern in the snapshot.
- Do not tell readers to use filters, saved searches, alerts, links, application flows, or other platform features unless the approved plan explicitly concerns that feature and gives the reader a clear benefit.
- Pick a materially different angle from every prior summary and topicKey.
- topicKey must be a stable, concise kebab-case description of the angle, not a date or random identifier.
- Write for a job seeker who will scroll past a report. Open on the tension in the figures, with the numbers inside that opening. Do not open with a census and then explain it.
- Address the reader through the shared problem, but do not invent a biography, country, profession, motive, or experience level.
- Say what the numbers do not prove once, in a sentence. Do not give that caveat its own paragraph or post, and do not restate it later.
- Spend the length on a specific choice the reader can make today. Name what they would look at, and what they would be deciding.
- End with a question that has a stake. Do not ask the reader to pick a category from the list you just recited.
- Sound like someone who read the listings. Do not narrate the dataset, the method, or "the takeaway". Do not use "the useful question is", "that distinction matters", or "a more grounded way".
- Be dense. Each post holds one new thought. Do not use one-line teasers, listicles, or filler to reach a count.
- If the evidence leaves no meaningful choice or tension, do not manufacture one, pad a negligible comparison, or imply that inspecting one outlier is useful merely because it exists.
- Do not include URLs, promotional calls to action, or claims that Jobmeerkat is the employer.
- Keep each post understandable in its thread order; do not add thread numbering unless it improves clarity.
- Bluesky: ${MIN_THREAD_POSTS}-${MAX_THREAD_POSTS} posts, no emojis, no hashtags, maximum ${BLUESKY_MAX_GRAPHEMES} graphemes each. Use most of that budget on every post.
- Threads: ${MIN_THREAD_POSTS}-${MAX_THREAD_POSTS} conversational posts, maximum ${THREADS_MAX_CHARACTERS} characters each, maximum one hashtag across the thread. Use most of that budget on every post.
- X: ${MIN_THREAD_POSTS}-${MAX_THREAD_POSTS} posts, maximum ${X_MAX_CHARACTERS} characters each, maximum one hashtag across the thread. Use most of that budget on every post.
- LinkedIn: exactly one native essay of ${LINKEDIN_MIN_CHARACTERS}-${LINKEDIN_MAX_CHARACTERS} characters, in short paragraphs. Reflect on the same argument at more length. Do not use a reply-thread format.
- summary must be a plain 1-280 character description used to prevent future repetition.
- evidenceIds must contain only IDs from retrieved evidence and include every item used to support the content. Those IDs stay in the evidenceIds field.

Return JSON matching this shape: ${JSON.stringify(example)}
`,
            },
        ],
    });

    return parseFollowerGrowthPosts(
        completion.choices[0].message.content,
        dataset,
        plan.family,
        { enforceLimits: false },
    );
};
