import {
    archiveClosedJobPosts,
    getArchiveClosedBefore,
} from './archiveClosedJobPosts';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { deleteJobPostPageCache } from 'jobPost/infrastructure/cache/s3/deleteJobPostPageCache';

jest.mock(
    'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository',
);
jest.mock('jobPost/infrastructure/cache/s3/deleteJobPostPageCache', () => ({
    deleteJobPostPageCache: jest.fn().mockResolvedValue(undefined),
}));

describe('archiveClosedJobPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns two-month cutoff timestamp', () => {
        const now = new Date(2026, 0, 15).getTime();
        const cutoff = getArchiveClosedBefore(now);

        expect(cutoff).toBe(now - 1000 * 60 * 60 * 24 * 30 * 2);
    });

    it('moves closed posts older than two months and deletes their S3 cache', async () => {
        const oldClosedJobPosts = [
            { id: 'job-1', companyId: 'company-1', slug: 'role-1' },
            { id: 'job-2', companyId: 'company-2', slug: 'role-2' },
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
        expect(deleteJobPostPageCache).toHaveBeenCalledWith('role-1');
        expect(deleteJobPostPageCache).toHaveBeenCalledWith('role-2');
        expect(result).toEqual({
            scanned: 2,
            moved: 2,
            failed: 0,
        });
    });

    it('is idempotent on reruns when no old closed posts remain in main table', async () => {
        (jobPostRepository.getAllClosedBefore as jest.Mock)
            .mockResolvedValueOnce([
                { id: 'job-1', companyId: 'company-1', slug: 'role-1' },
            ])
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
        expect(deleteJobPostPageCache).toHaveBeenCalledTimes(1);
    });
});
