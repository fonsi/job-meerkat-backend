import OpenAI from 'openai';
import {
    FOLLOWER_GROWTH_FAMILIES,
    FollowerGrowthContent,
    FollowerGrowthFamily,
} from 'social/domain/followerGrowthContent';
import {
    FOLLOWER_GROWTH_EVIDENCE_ROLES,
    FollowerGrowthConcept,
} from 'social/domain/followerGrowthPlan';
import { parseFollowerGrowthConcept } from './followerGrowthConcept';

const OPENAI_MODEL = 'gpt-6-luna';
const openai = new OpenAI();

type PlanFollowerGrowthConceptInput = {
    requestedFamily?: FollowerGrowthFamily;
    topic?: string;
    history: FollowerGrowthContent[];
    excludedConcepts?: string[];
    validationError?: string;
};

const example: FollowerGrowthConcept = {
    family: 'remoteWorkReality',
    readerProblem:
        'A remote listing names a location or region, and the reader cannot tell whether it is a preference or an eligibility rule',
    editorialThesis:
        'Remote describes where work happens, not necessarily where the employee may live',
    readerValue:
        'Readers will know which location wording to verify before deciding they are eligible',
    evidenceRole: 'illustrate',
};

export const openaiPlanFollowerGrowthConcept = async ({
    requestedFamily,
    topic,
    history,
    excludedConcepts = [],
    validationError,
}: PlanFollowerGrowthConceptInput): Promise<FollowerGrowthConcept> => {
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
                    'You are Jobmeerkat’s editorial concept planner. Choose a broadly useful, non-obvious problem for remote job seekers before seeing any listing data.',
            },
            {
                role: 'user',
                content: `
Choose one editorial concept for a social package.

Allowed families, use exactly one: ${FOLLOWER_GROWTH_FAMILIES.join(', ')}
Allowed evidence roles, use exactly one: ${FOLLOWER_GROWTH_EVIDENCE_ROLES.join(', ')}
Requested family: ${requestedFamily ?? 'choose one allowed family'}
Optional editorial direction: ${topic ?? 'none'}
Previously generated content to avoid: ${JSON.stringify(historyForPrompt)}
Concepts rejected because available evidence could not support them: ${JSON.stringify(excludedConcepts)}
Previous response validation error: ${validationError ?? 'none'}

Family purpose:
- salaryIntelligence: make salary ranges, floors, ceilings, and trade-offs easier to interpret.
- marketSnapshot: explain a broadly relevant constraint without ranking unrelated careers.
- listingTeardown: teach readers how to interpret a concrete part of a listing.
- applicationGuidance: help readers decide how to apply, prepare, or present partial fit.
- remoteWorkReality: clarify location, contract, collaboration, or hiring constraints of remote work.
- decisionFramework: resolve a credible trade-off between genuinely substitutable options.
- communityPrompt: invite experience around a specific dilemma, not a preference poll.

Rules:
- Choose the reader problem without assuming what Jobmeerkat data is available. Evidence will be selected later.
- Put specificity in the shared problem, tension, or decision—not in a country, profession, category, company, or demographic.
- The concept should be useful across professions and locations. Use a role or country only when the optional editorial direction explicitly requests it.
- editorialThesis must make a clear, non-obvious claim rather than announce a topic.
- readerValue must state what readers will understand or do differently after reading.
- evidenceRole describes whether later listing evidence should illustrate, support, or challenge the thesis. Evidence is not the topic.
- Do not mention Jobmeerkat, datasets, counts, listings inventory, filters, saved searches, alerts, links, or platform features.
- Avoid generic motivation, obvious reminders, preference polls, and advice that needs an invented personal biography.
- Choose a concept materially different from previous summaries, topic keys, and rejected concepts.

Return JSON matching this shape: ${JSON.stringify(example)}
`,
            },
        ],
    });

    try {
        return parseFollowerGrowthConcept(
            completion.choices[0].message.content,
            requestedFamily,
        );
    } catch (error) {
        if (validationError) throw error;

        return openaiPlanFollowerGrowthConcept({
            requestedFamily,
            topic,
            history,
            excludedConcepts,
            validationError:
                error instanceof Error ? error.message : 'Invalid concept',
        });
    }
};
