import { JobPost, JobType, Workplace } from 'jobPost/domain/jobPost';
import OpenAI from 'openai';

export type OpenaiJobPost = Omit<JobPost, 'id' | 'originalId' | 'companyId' | 'url' | 'createdAt' | 'closedAt'> & {
    createdAt?: number | null;
};

const OPENAI_MODEL = 'gpt-4o-mini';

const openai = new OpenAI();

const jobOfferExample: OpenaiJobPost = {
    title: 'Job offer title',
    category: 'frontend',
    type: JobType.FullTime,
    salaryRange: {
        min: 60000,
        max: 75000,
        currency: 'eur',
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
                    text: `Analyze the following job offer "${jobPostContent}". You have to extract the main data and return it. The output format must be a JSON following this example: ${JSON.stringify(jobOfferExample)}`,
                },
            ]
            },
        ],
    });
    
    return JSON.parse(completion.choices[0].message.content) as unknown as OpenaiJobPost;
}