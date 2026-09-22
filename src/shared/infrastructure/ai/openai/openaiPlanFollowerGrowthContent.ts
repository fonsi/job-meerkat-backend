import OpenAI from 'openai';
import { FollowerGrowthInventory } from 'social/application/followerGrowthDataResolver';
import {
    FOLLOWER_GROWTH_FAMILIES,
    FollowerGrowthContent,
    FollowerGrowthFamily,
} from 'social/domain/followerGrowthContent';
import {
    FOLLOWER_GROWTH_DETAIL_FIELDS,
    FollowerGrowthPlan,
} from 'social/domain/followerGrowthPlan';
import { parseFollowerGrowthPlan } from './followerGrowthPlan';

const OPENAI_MODEL = 'gpt-6-luna';
const openai = new OpenAI();

type PlanFollowerGrowthContentInput = {
    requestedFamily?: FollowerGrowthFamily;
    topic?: string;
    inventory: FollowerGrowthInventory;
    history: FollowerGrowthContent[];
    availabilityFeedback?: string[];
};

const dataCapabilities = [
    {
        kind: 'salaryDistribution',
        filters: ['category?', 'currency? (USD or EUR)'],
    },
    { kind: 'categoryDistribution' },
    { kind: 'locationDistribution', filters: ['category?'] },
    { kind: 'jobTypeDistribution', filters: ['category?'] },
    {
        kind: 'topListings',
        filters: ['category?', 'currency? (USD or EUR)'],
        required: ['limit (1-8)'],
    },
    {
        kind: 'listingDetails',
        filters: ['category?', 'currency? (USD or EUR)'],
        required: [
            `fields (1-4 of ${FOLLOWER_GROWTH_DETAIL_FIELDS.join(', ')})`,
            'sampleSize (1-20)',
        ],
    },
    {
        kind: 'detailPatterns',
        filters: ['category?', 'currency? (USD or EUR)'],
        required: [
            `fields (1-4 of ${FOLLOWER_GROWTH_DETAIL_FIELDS.join(', ')})`,
            'sampleSize (1-20)',
        ],
    },
    {
        kind: 'compareGroups',
        required: [
            'dimension (category, jobType, or location)',
            'groups (2-4 exact values from inventory)',
            'metric (count or salary)',
            'currency (required for salary)',
        ],
    },
];

const example = {
    family: 'applicationGuidance',
    angle: 'What recurring backend requirements imply for applicants',
    dataRequests: [
        {
            kind: 'detailPatterns',
            category: 'Backend',
            fields: ['requirements', 'stack'],
            sampleSize: 20,
        },
    ],
};

export const openaiPlanFollowerGrowthContent = async ({
    requestedFamily,
    topic,
    inventory,
    history,
    availabilityFeedback = [],
    validationError,
}: PlanFollowerGrowthContentInput & {
    validationError?: string;
}): Promise<FollowerGrowthPlan> => {
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
                    'You are Jobmeerkat’s social content planner. Select a useful, non-repetitive editorial angle and request only the minimum supported data needed to write it.',
            },
            {
                role: 'user',
                content: `
Plan one data-backed social package for remote job seekers.

Allowed families, use exactly one: ${FOLLOWER_GROWTH_FAMILIES.join(', ')}
Requested family: ${requestedFamily ?? 'choose one allowed family'}
Optional editorial direction: ${topic ?? 'none'}
Available data inventory: ${JSON.stringify(inventory)}
Supported data requests: ${JSON.stringify(dataCapabilities)}
Previously generated content to avoid: ${JSON.stringify(historyForPrompt)}
Feedback from an unavailable previous plan: ${JSON.stringify(availabilityFeedback)}
Previous response validation error: ${validationError ?? 'none'}

Rules:
- family must be exactly one allowed family value.
- Respect requestedFamily when supplied.
- Choose an angle materially different from prior summaries and topic keys.
- Use only request kinds and fields in the supported catalog.
- Use exact category, job type, location, and currency values shown in inventory.
- Request the minimum data needed; no more than four data requests.
- Use listingDetails for concrete examples and detailPatterns only when recurring fields support the angle.
- Salary comparisons must specify USD or EUR and must never compare different currencies.
- Current inventory is a snapshot. Do not plan claims about growth, decline, or historical trends.
- If availability feedback says a detail request is unavailable, do not request listingDetails or detailPatterns again. Use category, salary, job type, location, top listings, or comparisons instead.

Return JSON matching this shape: ${JSON.stringify(example)}
`,
            },
        ],
    });

    try {
        return parseFollowerGrowthPlan(
            completion.choices[0].message.content,
            requestedFamily,
        );
    } catch (error) {
        if (validationError) throw error;

        return openaiPlanFollowerGrowthContent({
            requestedFamily,
            topic,
            inventory,
            history,
            availabilityFeedback,
            validationError:
                error instanceof Error ? error.message : 'Invalid plan',
        });
    }
};
