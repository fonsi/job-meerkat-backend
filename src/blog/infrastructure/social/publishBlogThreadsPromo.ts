import { fitThreadsPost } from 'social/application/enforceSocialPostLimits';
import { publishThread } from 'social/infrastructure/provider/meta/request';
import { logger } from 'shared/infrastructure/logger/logger';
import { getErrorLogData } from 'shared/infrastructure/logger/getErrorLogData';
import {
    buildBlogPostPageUrl,
    UtmSource,
} from 'shared/infrastructure/url/buildJobPostPageUrl';
import { BlogPost } from 'blog/domain/blogPost';

export const publishBlogThreadsPromo = async (
    post: BlogPost,
): Promise<void> => {
    const url = buildBlogPostPageUrl(post.slug, UtmSource.Threads);
    const text = fitThreadsPost(`${post.title}\n\n${url}`);
    if (!text) return;

    try {
        await publishThread([text]);
    } catch (error) {
        logger.error(
            new Error('Failed to publish blog Threads promo'),
            getErrorLogData(error, { slug: post.slug }),
        );
    }
};
