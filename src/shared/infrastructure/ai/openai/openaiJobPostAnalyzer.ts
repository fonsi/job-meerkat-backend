import {
    Category,
    EngineeringCategories,
    JobPostDetails,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import OpenAI from 'openai';
import { OpenaiJobPost, parseOpenaiJobPost } from './parseOpenaiJobPost';

export type { OpenaiJobPost } from './parseOpenaiJobPost';

const OPENAI_MODEL = 'gpt-4o-mini';

const openai = new OpenAI();

const jobOfferDetailsExample: JobPostDetails = {
    summary:
        'Own the web app used by small businesses to run payroll and benefits.',
    team: 'Frontend platform team, reporting to the engineering manager.',
    stack: ['TypeScript', 'React', 'GraphQL', 'PostgreSQL'],
    responsibilities: [
        'Ship user-facing features from API to UI',
        'Improve performance of the main dashboard',
    ],
    requirements: [
        'Strong TypeScript and React experience',
        'Comfortable working in a distributed team',
    ],
    niceToHave: ['GraphQL', 'Previous payroll or fintech experience'],
    benefits: ['Early-exercisable equity', 'Paid parental leave'],
    hiringProcess: [
        'Hiring manager screen',
        'Take-home exercise',
        'Technical interview',
        'Leadership interview',
    ],
};

const jobOfferExample: OpenaiJobPost = {
    title: 'Job offer title',
    category: Category.Frontend,
    type: JobType.FullTime,
    salaryRange: {
        min: 60000,
        max: 75000,
        currency: 'eur',
        period: Period.Year,
    },
    workplace: Workplace.Remote,
    location: 'europe',
    details: jobOfferDetailsExample,
};

export const openaiJobPostAnalyzer = async (
    jobPostContent: string,
): Promise<OpenaiJobPost> => {
    const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        response_format: {
            type: 'json_object',
        },
        messages: [
            { role: 'system', content: 'You are a job post analyzer.' },
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `
                        Analyze the following job offer "${jobPostContent}".
                        You have to extract the main data and return it.
                        The output format must be a JSON following this example: ${JSON.stringify(jobOfferExample)}.
                        The category must be one in (${Object.values(Category)}).
                        If the job post title includes words like "Software engineer", "Engineer", "Developer" or "Architect" but you can't find a category that fits well, you can look for the required tech skills to guess if this position is for any of these engineering categories: ${EngineeringCategories.join(',')}.
                        If none of the categories matches, the category should be ${Category.Other}.
                        Location could be a city, a state, a country, a continent, a world region (like EMEA), a span of time zones or a list of the above.
                        If the job post is available from anywhere in the world, location should be 'worldwide'.
                        If you can't find a location within the job offer context, it should be 'unknown'.
                        Location never could be the word 'remote'.
                        The workplace must be one in (${Object.values(Workplace)}).
                        The salary range amounts could not be 0. If you can't find any of the amounts, you should set them to null.
                        Also fill "details" with a short summary of the offer. Summarize; do not copy long paragraphs.
                        details.summary: 2-4 sentences about what the job is.
                        Do not fill details.company. Company copy already lives on the company record.
                        details.team: only if the offer names a specific team, squad, or org (a product, group, or function more specific than "engineering" or "product"). Omit generic lines like "you'll join the engineering team" or "a small team of generalists".
                        details.stack: distinct technology names even if there is no "Our tech" heading.
                        details.responsibilities, details.requirements, details.niceToHave, details.benefits, details.hiringProcess: short bullet strings, at most 8 each.
                        details.benefits only when perks are specific (equity terms, parental leave, coworking, PTO), not "competitive benefits".
                        details.hiringProcess is the interview loop only, not how to fill the application or "click apply".
                        Omit any details key that is not clearly present. Do not invent facts. Do not copy example values.
                        Skip legal text, equal-opportunity / EEO statements, privacy / CCPA / GDPR notices, recruitment-fraud warnings, AI-hiring disclosures, country hiring guidelines, and application-form instructions.
                    `,
                    },
                ],
            },
        ],
    });

    return parseOpenaiJobPost(completion.choices[0].message.content);
};
