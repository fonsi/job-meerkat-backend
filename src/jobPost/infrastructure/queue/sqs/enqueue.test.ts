import { CompanyId } from 'company/domain/company';
import { JobPostId } from 'jobPost/domain/jobPost';
import { sendMessage } from 'shared/infrastructure/queue/sqs/sendMessage';
import { enqueueJobPostOgImage } from './enqueue';

jest.mock('shared/infrastructure/queue/sqs/sendMessage', () => ({
    sendMessage: jest.fn().mockResolvedValue(undefined),
}));

describe('enqueueJobPostOgImage', () => {
    it('sends the company and job post ids', async () => {
        process.env.GENERATE_JOB_POST_OG_IMAGE_QUEUE_URL =
            'https://sqs.example.com/og';
        const companyId = '123e4567-e89b-12d3-a456-426614174000' as CompanyId;
        const jobPostId = '123e4567-e89b-12d3-a456-426614174111' as JobPostId;

        await enqueueJobPostOgImage({ companyId, jobPostId });

        expect(sendMessage).toHaveBeenCalledWith({
            url: 'https://sqs.example.com/og',
            message: { companyId, jobPostId },
        });
    });
});
