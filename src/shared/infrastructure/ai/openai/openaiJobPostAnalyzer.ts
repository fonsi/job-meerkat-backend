import { Category, EngineeringCategories, JobPost, JobType, Period, Workplace } from 'jobPost/domain/jobPost';
import OpenAI from 'openai';

export type OpenaiJobPost = Omit<JobPost, 'id' | 'originalId' | 'companyId' | 'url' | 'createdAt' | 'closedAt'> & {
    createdAt?: number | null;
};

const OPENAI_MODEL = 'gpt-4o-mini';

const openai = new OpenAI();

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
    location: 'europe'
};

export const openaiJobPostAnalyzer = async (jobPostContent: string): Promise<OpenaiJobPost> => {
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
                        If the job post title says something like "Software engineer" or "Developer" but you can't find a category that fits well, you can look for the required tech skills to guess if this position is for any of these engineering categories: ${EngineeringCategories.join(',')}.
                        If none of the categories matches, the category should be ${Category.Other}.
                    `,
                },
            ]
            },
        ],
    });
    
    return JSON.parse(completion.choices[0].message.content) as unknown as OpenaiJobPost;
}