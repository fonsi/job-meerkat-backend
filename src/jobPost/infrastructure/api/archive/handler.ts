import 'source-map-support/register';
import { archiveClosedJobPosts } from 'jobPost/application/archiveClosedJobPosts';

export const index = async () => {
    try {
        console.log('[ARCHIVING CLOSED JOB POSTS]');
        const result = await archiveClosedJobPosts();
        console.log(
            `[ARCHIVING CLOSED JOB POSTS DONE] scanned=${result.scanned} moved=${result.moved} failed=${result.failed}`,
        );
    } catch (e) {
        console.log(`[Error]: ${e.message}`);

        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'Something went wrong',
            }),
        };
    }
};
