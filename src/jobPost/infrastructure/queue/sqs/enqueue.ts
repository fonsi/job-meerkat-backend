import { sendMessage } from 'shared/infrastructure/queue/sqs/sendMessage';
import { GenerateJobPostOgImageMessage } from './ogImageMessage';

export const enqueueJobPostOgImage = async (
    message: GenerateJobPostOgImageMessage,
): Promise<void> => {
    const url = process.env.GENERATE_JOB_POST_OG_IMAGE_QUEUE_URL;
    if (!url)
        throw new Error('GENERATE_JOB_POST_OG_IMAGE_QUEUE_URL is not set');

    await sendMessage({
        url,
        message,
    });
};
