import { SocialPostType } from 'social/domain/socialPostType';
import { SOCIAL_POST_SLOT_MS } from 'social/domain/socialScheduleConfig';
import { scheduledSocialPostRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbScheduledSocialPostRepository';
import {
    buildBlogPromoSchedule,
    scheduleBlogSocialPromo,
} from './scheduleBlogSocialPromo';

jest.mock(
    'social/infrastructure/persistance/dynamodb/dynamodbScheduledSocialPostRepository',
    () => ({
        scheduledSocialPostRepository: {
            getAll: jest.fn(),
            add: jest.fn(),
            remove: jest.fn(),
        },
    }),
);

describe('buildBlogPromoSchedule', () => {
    it('schedules both platforms on a free hot slot', () => {
        const scheduled = buildBlogPromoSchedule(
            { slug: 'remote-job-market-2026-09' },
            Date.UTC(2026, 9, 1, 8),
        );

        expect(scheduled.type).toBe(SocialPostType.BlogPromo);
        expect(scheduled.blogSlug).toBe('remote-job-market-2026-09');
        expect(scheduled.platforms).toEqual(['threads', 'bluesky']);
        expect(scheduled.id).toBe('blogPromo_remote-job-market-2026-09');
        expect(scheduled.date).toBeGreaterThan(Date.UTC(2026, 9, 1, 8));
    });

    it('avoids an already reserved slot (e.g. another blog promo)', () => {
        const first = buildBlogPromoSchedule(
            { slug: 'remote-job-market-2026-09' },
            Date.UTC(2026, 9, 1, 8),
        );
        const second = buildBlogPromoSchedule(
            { slug: 'backend-jobs-2026-09-28' },
            Date.UTC(2026, 9, 1, 8),
            [first.date],
        );

        expect(second.date).toBe(first.date + SOCIAL_POST_SLOT_MS);
    });
});

describe('scheduleBlogSocialPromo', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (scheduledSocialPostRepository.getAll as jest.Mock).mockResolvedValue(
            [],
        );
    });

    it('replaces an existing promo for the same slug', async () => {
        const previous = buildBlogPromoSchedule(
            { slug: 'remote-job-market-2026-09' },
            Date.UTC(2026, 8, 1, 8),
        );
        (scheduledSocialPostRepository.getAll as jest.Mock).mockResolvedValue([
            previous,
        ]);

        await scheduleBlogSocialPromo(
            { slug: 'remote-job-market-2026-09' },
            Date.UTC(2026, 9, 1, 8),
        );

        expect(scheduledSocialPostRepository.remove).toHaveBeenCalledWith(
            previous,
        );
        expect(scheduledSocialPostRepository.add).toHaveBeenCalledWith(
            expect.objectContaining({
                blogSlug: 'remote-job-market-2026-09',
                type: SocialPostType.BlogPromo,
            }),
        );
    });

    it('does not collide with another pending blog promo', async () => {
        const monthly = buildBlogPromoSchedule(
            { slug: 'remote-job-market-2026-09' },
            Date.UTC(2026, 9, 1, 8),
        );
        (scheduledSocialPostRepository.getAll as jest.Mock).mockResolvedValue([
            monthly,
        ]);

        await scheduleBlogSocialPromo(
            { slug: 'backend-jobs-2026-09-28' },
            Date.UTC(2026, 9, 1, 8, 5),
        );

        expect(scheduledSocialPostRepository.add).toHaveBeenCalledWith(
            expect.objectContaining({
                blogSlug: 'backend-jobs-2026-09-28',
                date: monthly.date + SOCIAL_POST_SLOT_MS,
            }),
        );
    });
});
