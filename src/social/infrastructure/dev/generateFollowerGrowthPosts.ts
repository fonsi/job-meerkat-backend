import 'source-map-support/register';
import {
    generateFollowerGrowthPosts,
    GenerateFollowerGrowthPostsInput,
} from 'social/application/generateFollowerGrowthPosts';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';

export const index = async (event: GenerateFollowerGrowthPostsInput = {}) => {
    initializeLogger();

    try {
        const posts = await generateFollowerGrowthPosts(event);
        console.log(JSON.stringify(posts, null, 2));

        return posts;
    } catch (error) {
        const prefixedError = errorWithPrefix(
            error,
            'generate follower growth posts',
        );
        logger.error(prefixedError);
        await logger.wait();
        throw prefixedError;
    }
};
