import { CompanyId } from 'company/domain/company';
import { JobPostId } from 'jobPost/domain/jobPost';
import { sendMessage } from 'shared/infrastructure/queue/sqs/sendMessage';

type SocialPostEnqueuer = (
    jobPostId: JobPostId,
    companyId: CompanyId,
) => Promise<void>;

const QUEUE_URL = process.env.PUBLISH_SOCIAL_POST_QUEUE_NAME;

export const enqueue: SocialPostEnqueuer = async (jobPostId, companyId) =>
    await sendMessage({
        url: QUEUE_URL,
        message: JSON.stringify({ jobPostId, companyId }),
    });
