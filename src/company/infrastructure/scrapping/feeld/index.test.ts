import { feeldScrapper } from './index';
import { openaiJobPostAnalyzer } from 'shared/infrastructure/ai/openai/openaiJobPostAnalyzer';

jest.mock('shared/infrastructure/ai/openai/openaiJobPostAnalyzer', () => ({
    openaiJobPostAnalyzer: jest.fn(),
}));

jest.mock('shared/infrastructure/logger/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

const COMPANY_ID = '123e4567-e89b-12d3-a456-426614174000';

const jsonResponse = (body: unknown) =>
    ({
        ok: true,
        status: 200,
        json: async () => body,
    }) as unknown as Response;

const workableJob = (id: number, shortcode: string, title: string) => ({
    id,
    shortcode,
    title,
    state: 'published',
});

describe('feeldScrapper', () => {
    const originalFetch = global.fetch;

    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });

    it('lists jobs using the Workable shortcode as id, not the numeric id', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            jsonResponse({
                total: 1,
                results: [
                    workableJob(
                        5797272,
                        '24D9AA3784',
                        'Director of Global Markets',
                    ),
                ],
            }),
        );
        global.fetch = fetchMock;

        const listed = await feeldScrapper({
            companyId: COMPANY_ID as never,
        }).getListedJobPostsData();

        expect(fetchMock).toHaveBeenCalledWith(
            'https://apply.workable.com/api/v3/accounts/feeldco/jobs',
            expect.objectContaining({ method: 'POST' }),
        );
        expect(listed).toEqual([
            {
                id: '24D9AA3784',
                url: 'https://apply.workable.com/feeldco/j/24D9AA3784',
                title: 'Director of Global Markets',
            },
        ]);
    });

    it('follows nextPage tokens and dedupes shortcodes', async () => {
        const fetchMock = jest
            .fn()
            .mockResolvedValueOnce(
                jsonResponse({
                    total: 3,
                    nextPage: 'page-2',
                    results: [
                        workableJob(1, 'AAA111', 'Role A'),
                        workableJob(2, 'BBB222', 'Role B'),
                    ],
                }),
            )
            .mockResolvedValueOnce(
                jsonResponse({
                    total: 3,
                    results: [
                        workableJob(2, 'BBB222', 'Role B'),
                        workableJob(3, 'CCC333', 'Role C'),
                        { id: 4, title: 'No shortcode' },
                    ],
                }),
            );
        global.fetch = fetchMock;

        const listed = await feeldScrapper({
            companyId: COMPANY_ID as never,
        }).getListedJobPostsData();

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
            token: 'page-2',
        });
        expect(listed.map((jobPost) => jobPost.id)).toEqual([
            'AAA111',
            'BBB222',
            'CCC333',
        ]);
    });

    it('throws when the Workable listing request fails', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
            json: async () => ({}),
        } as unknown as Response);

        await expect(
            feeldScrapper({
                companyId: COMPANY_ID as never,
            }).getListedJobPostsData(),
        ).rejects.toThrow('status 500');
    });

    it('scrapes posts with originalId equal to the listed shortcode', async () => {
        const fetchMock = jest.fn().mockResolvedValue(
            jsonResponse({
                shortcode: '24D9AA3784',
                published: '2026-09-01T00:00:00.000Z',
            }),
        );
        global.fetch = fetchMock;
        (openaiJobPostAnalyzer as jest.Mock).mockResolvedValue({
            title: 'ignored',
        });

        const scrapped = await feeldScrapper({
            companyId: COMPANY_ID as never,
        }).scrapJobPost([
            {
                id: '24D9AA3784',
                url: 'https://apply.workable.com/feeldco/j/24D9AA3784',
                title: 'Director of Global Markets',
            },
        ]);

        expect(fetchMock).toHaveBeenCalledWith(
            'https://apply.workable.com/api/v2/accounts/feeldco/jobs/24D9AA3784',
        );
        expect(scrapped).toHaveLength(1);
        expect(scrapped[0]).toEqual(
            expect.objectContaining({
                originalId: '24D9AA3784',
                url: 'https://apply.workable.com/feeldco/j/24D9AA3784',
                title: 'Director of Global Markets',
                companyId: COMPANY_ID,
                createdAt: new Date('2026-09-01T00:00:00.000Z').getTime(),
            }),
        );
    });
});
