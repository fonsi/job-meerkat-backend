import OpenAI from 'openai';
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

type ReviewFollowerGrowthPostsInput = {
    plan: FollowerGrowthPlan;
    dataset: FollowerGrowthDataset;
    draft: FollowerGrowthPosts;
    validationError?: string;
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

const draftForPrompt = (draft: FollowerGrowthPosts) => ({
    family: draft.family,
    topicKey: draft.topicKey,
    summary: draft.summary,
    evidenceIds: draft.evidence.map(({ id }) => id),
    posts: {
        bluesky: draft.bluesky,
        threads: draft.threads,
        x: draft.x,
        linkedin: draft.linkedin,
    },
});

export const openaiReviewFollowerGrowthPosts = async ({
    plan,
    dataset,
    draft,
    validationError,
}: ReviewFollowerGrowthPostsInput): Promise<FollowerGrowthPosts> => {
    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                    'You are Jobmeerkat’s social editor. Revise a drafted social package for consistency, density, and length. Trust the facts already in the draft.',
            },
            {
                role: 'user',
                content: `
Revise this drafted follower-growth package. Return the full revised package.

Approved editorial plan: ${JSON.stringify(plan)}
Draft: ${JSON.stringify(draftForPrompt(draft))}
Previous response validation error: ${validationError ?? 'none'}

Rules:
- Keep the family, topicKey, and evidenceIds. Revise the summary only when the revised wording makes the draft summary inaccurate. Keep the summary to 1-280 characters.
- Preserve the approved readerProblem, editorialThesis, readerValue, and evidenceRole. Every paragraph or thread post must make the broad problem clearer or deliver that value.
- Keep specificity in the shared problem. If the draft turns a country, profession, category, company, or demographic from the evidence into its target audience, rewrite it as an example serving the broader thesis.
- Remove advice to inspect or switch to an unrelated profession merely because its listing count is higher.
- Keep Jobmeerkat as an optional source attribution, not the subject. Mention it no more than once and remove instructions about filters, saved searches, alerts, links, application flows, or other platform features unless the approved plan explicitly concerns that feature.
- Trust the facts already in the draft. Do not add facts, percentages, causes, outcomes, or claims that the draft does not already make.
- Make Bluesky, Threads, X, and LinkedIn argue the same point. Remove contradictions between platforms.
- Each later thread post must add a thought. Cut restatement and filler. If the draft repeats a caveat, keep it once and spend the recovered length on the reader's choice.
- Delete evidence ids and citations such as [request-1] or (request-1) from every post. They are metadata, not copy.
- If the draft reads like a report followed by a disclaimer, rewrite it so the numbers sit inside a choice a job seeker is making. Do not add facts. Do not narrate the dataset or announce a takeaway.
- If one alternative is negligible, do not pretend it creates a balanced decision or recommend inspecting an outlier just because it exists. Keep only a broader insight the draft genuinely supports.
- Do not include URLs, promotional calls to action, or claims that Jobmeerkat is the employer.
- Bluesky: ${MIN_THREAD_POSTS}-${MAX_THREAD_POSTS} posts, no emojis, no hashtags, maximum ${BLUESKY_MAX_GRAPHEMES} graphemes each.
- Threads: ${MIN_THREAD_POSTS}-${MAX_THREAD_POSTS} posts, maximum ${THREADS_MAX_CHARACTERS} characters each, maximum one hashtag across the thread.
- X: ${MIN_THREAD_POSTS}-${MAX_THREAD_POSTS} posts, maximum ${X_MAX_CHARACTERS} characters each, maximum one hashtag across the thread.
- LinkedIn: exactly one post of ${LINKEDIN_MIN_CHARACTERS}-${LINKEDIN_MAX_CHARACTERS} characters, in short paragraphs.
- If a draft misses a count or length limit, rewrite it until it fits. Shorten posts that are too long, add posts that develop the argument when a thread is too short, and merge posts when a thread or LinkedIn is too long.

Return JSON matching this shape: ${JSON.stringify(example)}
`,
            },
        ],
    });

    try {
        return parseFollowerGrowthPosts(
            completion.choices[0].message.content,
            dataset,
            plan.family,
        );
    } catch (error) {
        if (validationError) throw error;

        return openaiReviewFollowerGrowthPosts({
            plan,
            dataset,
            draft,
            validationError:
                error instanceof Error ? error.message : 'Invalid posts',
        });
    }
};
