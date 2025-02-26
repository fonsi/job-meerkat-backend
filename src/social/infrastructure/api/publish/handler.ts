import 'source-map-support/register';
import { serverError } from 'shared/infrastructure/api/response';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';
import { publishSocialPosts } from 'social/application/publishSocialPosts';
import { JobPostId } from 'jobPost/domain/jobPost';
import { CompanyId } from 'company/domain/company';

type EventData = {
    jobPostId: JobPostId;
    companyId: CompanyId;
};

export const index = async (event) => {
    try {
        const socialPostsToPublishBatch: Promise<void>[] = event.Records.map(
            (record) => {
                const { jobPostId, companyId } = JSON.parse(
                    record.body,
                ) as unknown as EventData;
                console.log(`[PUBLISH POST]: ${jobPostId} - ${companyId}`);

                return publishSocialPosts({ jobPostId, companyId });
            },
        );

        await Promise.all(socialPostsToPublishBatch);
    } catch (e) {
        const error = errorWithPrefix(e, 'publish social posts');
        logger.error(error);
        await logger.wait();

        return serverError();
    }
};
