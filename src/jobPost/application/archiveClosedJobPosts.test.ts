import {
    archiveClosedJobPosts,
    getArchiveClosedBefore,
} from './archiveClosedJobPosts';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';

jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
);

describe('archiveClosedJobPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns six-month cutoff timestamp', () => {
        const now = new Date(2026, 0, 15).getTime();
        const cutoff = getArchiveClosedBefore(now);

        expect(cutoff).toBe(now - 1000 * 60 * 60 * 24 * 30 * 6);
    });

    it('moves only closed posts older than six months provided by repository selection', async () => {
        const oldClosedJobPosts = [
            { id: 'job-1', companyId: 'company-1' },
            { id: 'job-2', companyId: 'company-2' },
        ];

        (jobPostRepository.getAllClosedBefore as jest.Mock).mockResolvedValue(
            oldClosedJobPosts,
        );
        (jobPostRepository.moveClosedToArchive as jest.Mock).mockResolvedValue(
            undefined,
        );

        const result = await archiveClosedJobPosts();

        expect(jobPostRepository.getAllClosedBefore).toHaveBeenCalledTimes(1);
        expect(jobPostRepository.moveClosedToArchive).toHaveBeenCalledTimes(2);
        expect(result).toEqual({
            scanned: 2,
            moved: 2,
            failed: 0,
        });
    });

    it('is idempotent on reruns when no old closed posts remain in main table', async () => {
        (jobPostRepository.getAllClosedBefore as jest.Mock)
            .mockResolvedValueOnce([{ id: 'job-1', companyId: 'company-1' }])
            .mockResolvedValueOnce([]);
        (jobPostRepository.moveClosedToArchive as jest.Mock).mockResolvedValue(
            undefined,
        );

        const firstRun = await archiveClosedJobPosts();
        const secondRun = await archiveClosedJobPosts();

        expect(firstRun).toEqual({
            scanned: 1,
            moved: 1,
            failed: 0,
        });
        expect(secondRun).toEqual({
            scanned: 0,
            moved: 0,
            failed: 0,
        });
        expect(jobPostRepository.moveClosedToArchive).toHaveBeenCalledTimes(1);
    });
});
