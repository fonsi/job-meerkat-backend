import 'source-map-support/register';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { publishSocialPost } from 'social/application/publishSocialPost';
import { JobPostId } from 'jobPost/domain/jobPost';
import { CompanyId } from 'company/domain/company';

type EventData = {
    jobPostId: JobPostId;
    companyId: CompanyId;
};

const getEventData = (record): EventData => {
    try {
        return JSON.parse(record.body) as EventData;
    } catch (error) {
        throw errorWithPrefix(error, 'Error parsing SQS record body');
    }
};

export const index = async (event, _, callback) => {
    try {
        initializeLogger();

        const socialPostsToPublishBatch: Promise<void>[] = event.Records.map(
            (record) => {
                const { jobPostId, companyId } = getEventData(record);
                console.log(`[PUBLISH POST]: ${jobPostId} - ${companyId}`);

                return publishSocialPost({ jobPostId, companyId });
            },
        );

        await Promise.allSettled(socialPostsToPublishBatch).then((results) => {
            results.forEach((result, index) => {
                console.log(
                    `[PUBLISH POST RESULT] ${result.status}: ${JSON.stringify(result)}`,
                );
                if (result.status === 'rejected') {
                    const { jobPostId, companyId } = getEventData(
                        event.Records[index],
                    );
                    logger.error(
                        errorWithPrefix(
                            new Error(result.reason),
                            `Error publishing social post: ${jobPostId} - ${companyId}`,
                        ),
                    );
                }
            });
        });
    } catch (error) {
        logger.error(errorWithPrefix(error, 'Error processing SQS event'));
    } finally {
        await logger.wait();

        callback(null, '[PUBLISH POST] Done');
    }
};
