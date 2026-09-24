import OpenAI from 'openai';
import { FollowerGrowthInventory } from 'social/application/followerGrowthDataResolver';
import {
    FOLLOWER_GROWTH_DETAIL_FIELDS,
    FollowerGrowthConcept,
    FollowerGrowthPlan,
} from 'social/domain/followerGrowthPlan';
import { parseFollowerGrowthPlan } from './followerGrowthPlan';

const OPENAI_MODEL = 'gpt-6-luna';
const openai = new OpenAI();

type PlanFollowerGrowthContentInput = {
    concept: FollowerGrowthConcept;
    inventory: FollowerGrowthInventory;
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
    supported: true,
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
    concept,
    inventory,
    availabilityFeedback = [],
    validationError,
}: PlanFollowerGrowthContentInput & {
    validationError?: string;
}): Promise<FollowerGrowthPlan | null> => {
    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: { type: 'json_object' },
        messages: [
            {
                role: 'system',
                content:
                    'You are Jobmeerkat’s evidence planner. Find listing evidence for an approved broad editorial concept without changing or narrowing that concept.',
            },
            {
                role: 'user',
                content: `
Select evidence for one approved editorial concept.

Approved concept: ${JSON.stringify(concept)}
Available data inventory: ${JSON.stringify(inventory)}
Supported data requests: ${JSON.stringify(dataCapabilities)}
Feedback from unavailable previous requests: ${JSON.stringify(availabilityFeedback)}
Previous response validation error: ${validationError ?? 'none'}

Rules:
- Do not rewrite, specialize, or narrow readerProblem, editorialThesis, or readerValue to fit the inventory.
- A role, category, country, or location may be an example in the evidence, but it must not become the target audience or thesis.
- Request evidence only when it can ${concept.evidenceRole} the approved thesis while preserving its broad relevance.
- Return supported=false when this inventory cannot credibly support the concept. Do not force an easier statistic into an unrelated point.
- Use only request kinds and fields in the supported catalog.
- Use exact category, job type, location, and currency values shown in inventory.
- Request the minimum data needed; no more than four data requests.
- Prefer listingDetails for concrete examples and detailPatterns for recurring requirements or language.
- Salary comparisons must specify USD or EUR and must never compare different currencies.
- Current inventory is a snapshot. Do not plan claims about growth, decline, or historical trends.
- If availability feedback says a detail request is unavailable, do not request listingDetails or detailPatterns again.
- categoryDistribution cannot be the only request. Counts of unrelated professions do not support career advice.
- Do not request a comparison when one visible inventory group is negligible.

Return JSON matching ${JSON.stringify(example)} when supported, or {"supported":false} when the available data cannot support the concept.
`,
            },
        ],
    });

    try {
        return parseFollowerGrowthPlan(
            completion.choices[0].message.content,
            concept,
        );
    } catch (error) {
        if (validationError) throw error;

        return openaiPlanFollowerGrowthContent({
            concept,
            inventory,
            availabilityFeedback,
            validationError:
                error instanceof Error ? error.message : 'Invalid plan',
        });
    }
};
