import { BlogPost } from 'blog/domain/blogPost';
import { logger } from 'shared/infrastructure/logger/logger';
import { getErrorLogData } from 'shared/infrastructure/logger/getErrorLogData';
import {
    pickNextFreeSocialSlot,
    reservedPinnedSocialHours,
} from 'social/domain/pickNextFreeSocialSlot';
import {
    makeScheduledSocialPostId,
    ScheduledSocialPost,
} from 'social/domain/scheduledSocialPost';
import { ALL_SOCIAL_PLATFORMS } from 'social/domain/socialPlatform';
import { SocialPostType } from 'social/domain/socialPostType';
import { scheduledSocialPostRepository } from 'social/infrastructure/persistance/dynamodb/dynamodbScheduledSocialPostRepository';

export const buildBlogPromoSchedule = (
    post: Pick<BlogPost, 'slug'>,
    now = Date.now(),
    reservedDates: number[] = [],
): ScheduledSocialPost => ({
    id: makeScheduledSocialPostId({
        type: SocialPostType.BlogPromo,
        blogSlug: post.slug,
    }),
    type: SocialPostType.BlogPromo,
    platforms: [...ALL_SOCIAL_PLATFORMS],
    date: pickNextFreeSocialSlot({
        now,
        reserved: [...reservedDates, ...reservedPinnedSocialHours(now)],
    }),
    blogSlug: post.slug,
});

export const scheduleBlogSocialPromo = async (
    post: Pick<BlogPost, 'slug'>,
    now = Date.now(),
): Promise<void> => {
    try {
        const existing = await scheduledSocialPostRepository.getAll();
        const sameSlug = existing.filter(
            (item) =>
                item.type === SocialPostType.BlogPromo &&
                item.blogSlug === post.slug,
        );
        const reservedDates = existing
            .filter(
                (item) =>
                    !(
                        item.type === SocialPostType.BlogPromo &&
                        item.blogSlug === post.slug
                    ),
            )
            .map((item) => item.date);
        const scheduled = buildBlogPromoSchedule(post, now, reservedDates);

        await Promise.all(
            sameSlug.map((item) => scheduledSocialPostRepository.remove(item)),
        );
        await scheduledSocialPostRepository.add(scheduled);
        console.log(
            `[BLOG PROMO] scheduled slug=${post.slug} at=${new Date(scheduled.date).toISOString()} platforms=${scheduled.platforms.join(',')}`,
        );
    } catch (error) {
        logger.error(
            new Error('Failed to schedule blog social promo'),
            getErrorLogData(error, { slug: post.slug }),
        );
    }
};
