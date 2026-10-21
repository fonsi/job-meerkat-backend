import { happyMoneyScrapper } from './index';

const COMPANY_ID = '123e4567-e89b-12d3-a456-426614174000';

const jsonResponse = (body: unknown) =>
    ({
        ok: true,
        status: 200,
        json: async () => body,
    }) as unknown as Response;

describe('happyMoneyScrapper', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('returns listed job ids as strings', async () => {
        global.fetch = jest.fn().mockResolvedValue(
            jsonResponse({
                departments: [
                    {
                        jobs: [
                            {
                                id: 8855945002,
                                absolute_url:
                                    'https://boards.greenhouse.io/happymoney/jobs/8855945002',
                                title: 'Software Engineer',
                                updated_at: '2026-09-29T16:05:00Z',
                            },
                        ],
                    },
                ],
            }),
        );

        const listed = await happyMoneyScrapper({
            companyId: COMPANY_ID as never,
        }).getListedJobPostsData();

        expect(listed).toHaveLength(1);
        expect(listed[0].id).toBe('8855945002');
        expect(typeof listed[0].id).toBe('string');
    });
});
