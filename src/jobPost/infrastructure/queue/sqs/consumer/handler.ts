import 'source-map-support/register';
import { generateAndStoreJobPostOgImage } from 'jobPost/application/generateAndStoreJobPostOgImage';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { GenerateJobPostOgImageMessage } from '../ogImageMessage';

const getMessage = (record): GenerateJobPostOgImageMessage => {
    try {
        return JSON.parse(record.body) as GenerateJobPostOgImageMessage;
    } catch (error) {
        throw errorWithPrefix(error, 'Error parsing SQS record body');
    }
};

export const index = async (event): Promise<void> => {
    initializeLogger();

    try {
        for (const record of event.Records) {
            const { companyId, jobPostId } = getMessage(record);
            console.log(`[GENERATE OG IMAGE]: ${companyId} ${jobPostId}`);
            await generateAndStoreJobPostOgImage({ companyId, jobPostId });
        }
    } catch (error) {
        logger.error(errorWithPrefix(error, 'Error generating OG image'));
        throw error;
    } finally {
        await logger.wait();
    }
};
