import { normalizeJobPostDetails } from './jobPost';

describe('normalizeJobPostDetails', () => {
    it('returns undefined when details are missing or empty', () => {
        expect(normalizeJobPostDetails(undefined)).toBeUndefined();
        expect(normalizeJobPostDetails(null)).toBeUndefined();
        expect(normalizeJobPostDetails({})).toBeUndefined();
        expect(
            normalizeJobPostDetails({
                summary: '  ',
                stack: [],
                benefits: ['', '   '],
            }),
        ).toBeUndefined();
    });

    it('trims text, drops empty list items, and caps lists', () => {
        expect(
            normalizeJobPostDetails({
                summary: '  Builds the API  ',
                team: ' Platform squad ',
                stack: [' TypeScript ', '', 'Kafka', 'Go'],
                responsibilities: Array.from(
                    { length: 10 },
                    (_, i) => `Do thing ${i + 1}`,
                ),
                niceToHave: [123 as unknown as string],
            }),
        ).toEqual({
            summary: 'Builds the API',
            team: 'Platform squad',
            stack: ['TypeScript', 'Kafka', 'Go'],
            responsibilities: [
                'Do thing 1',
                'Do thing 2',
                'Do thing 3',
                'Do thing 4',
                'Do thing 5',
                'Do thing 6',
                'Do thing 7',
                'Do thing 8',
            ],
        });
    });
});
