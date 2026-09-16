import { Category, JobType, Period, Workplace } from 'jobPost/domain/jobPost';
import { parseOpenaiJobPost } from './parseOpenaiJobPost';

const analyzedCore = {
    title: 'Backend Engineer',
    category: Category.Backend,
    type: JobType.FullTime,
    salaryRange: {
        min: 120000,
        max: 160000,
        currency: 'usd',
        period: Period.Year,
    },
    workplace: Workplace.Remote,
    location: 'worldwide',
};

describe('parseOpenaiJobPost', () => {
    it('keeps summarized details and drops empty keys', () => {
        const parsed = parseOpenaiJobPost(
            JSON.stringify({
                ...analyzedCore,
                details: {
                    summary: ' Own ingestion pipelines. ',
                    team: '  ',
                    stack: ['Kafka', 'ClickHouse', ''],
                    benefits: [],
                    hiringProcess: ['Hiring manager screen'],
                },
            }),
        );

        expect(parsed.details).toEqual({
            summary: 'Own ingestion pipelines.',
            stack: ['Kafka', 'ClickHouse'],
            hiringProcess: ['Hiring manager screen'],
        });
    });

    it('omits details when the model returns nothing useful', () => {
        const parsed = parseOpenaiJobPost(
            JSON.stringify({
                ...analyzedCore,
                details: null,
            }),
        );

        expect(parsed.details).toBeUndefined();
    });

    it('throws when the model returns no content', () => {
        expect(() => parseOpenaiJobPost(null)).toThrow(
            'Empty OpenAI job post response',
        );
        expect(() => parseOpenaiJobPost(undefined)).toThrow(
            'Empty OpenAI job post response',
        );
        expect(() => parseOpenaiJobPost('')).toThrow(
            'Empty OpenAI job post response',
        );
    });

    it('throws when the model returns a non-object', () => {
        expect(() => parseOpenaiJobPost('null')).toThrow(
            'Invalid OpenAI job post response',
        );
        expect(() => parseOpenaiJobPost('[]')).toThrow(
            'Invalid OpenAI job post response',
        );
    });
});
