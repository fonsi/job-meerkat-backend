import 'source-map-support/register';
import {
    generateScheduledBlogPost,
    parseBlogPostKind,
} from 'blog/application/generateScheduledBlogPost';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';

export const index = async () => {
    try {
        initializeLogger();
        const kind = parseBlogPostKind(process.env.BLOG_POST_KIND);
        console.log(`[BLOG GENERATE] kind=${kind}`);
        const result = await generateScheduledBlogPost(kind);
        console.log(`[BLOG GENERATE DONE] ${JSON.stringify(result)}`);
        await logger.wait();

        return { statusCode: 200, body: JSON.stringify(result) };
    } catch (e) {
        const error = errorWithPrefix(e as Error, 'generate blog post');
        const raw = e as {
            name?: string;
            message?: string;
            Code?: string;
            code?: string;
            $metadata?: { httpStatusCode?: number; requestId?: string };
        };
        const aws = {
            name: raw.name,
            message: raw.message,
            code: raw.Code ?? raw.code,
            httpStatusCode: raw.$metadata?.httpStatusCode,
            requestId: raw.$metadata?.requestId,
        };
        console.error('[BLOG GENERATE FAILED]', error.message, aws);
        logger.error(error, { aws });
        await logger.wait();

        return { statusCode: 400 };
    }
};
