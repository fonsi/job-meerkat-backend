import { JobPost } from 'jobPost/domain/jobPost';
import { deleteJobPostPageCache } from 'jobPost/infrastructure/cache/s3/deleteJobPostPageCache';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';

const TWO_MONTHS_IN_MS = 1000 * 60 * 60 * 24 * 30 * 2;
const CHUNK_SIZE = 8;
const MAX_PER_RUN = 500;

type ArchiveClosedJobPostsResult = {
    scanned: number;
    moved: number;
    failed: number;
    remaining: number;
};

export const getArchiveClosedBefore = (now: number = Date.now()): number =>
    now - TWO_MONTHS_IN_MS;

const archiveOne = async (
    jobPost: JobPost,
    closedBefore: number,
): Promise<boolean> => {
    try {
        await jobPostRepository.moveClosedToArchive(jobPost, closedBefore);
        await deleteJobPostPageCache(jobPost.slug);
        return true;
    } catch (e) {
        const error = errorWithPrefix(
            e instanceof Error ? e : new Error(String(e)),
            'Archive closed job post',
        );
        logger.error(error, {
            id: jobPost.id,
            companyId: jobPost.companyId,
        });
        return false;
    }
};

export const archiveClosedJobPosts =
    async (): Promise<ArchiveClosedJobPostsResult> => {
        const closedBefore = getArchiveClosedBefore();
        const candidates =
            await jobPostRepository.getAllClosedBefore(closedBefore);
        const batch = candidates.slice(0, MAX_PER_RUN);

        let moved = 0;
        let failed = 0;

        for (let index = 0; index < batch.length; index += CHUNK_SIZE) {
            const chunk = batch.slice(index, index + CHUNK_SIZE);
            const results = await Promise.all(
                chunk.map((jobPost) => archiveOne(jobPost, closedBefore)),
            );
            moved += results.filter(Boolean).length;
            failed += results.filter((ok) => !ok).length;
        }

        const remaining = Math.max(0, candidates.length - batch.length);
        const result = {
            scanned: candidates.length,
            moved,
            failed,
            remaining,
        };

        if (failed > 0 || remaining > 0) {
            logger.error(
                new Error('Archive closed job posts incomplete'),
                result,
            );
        }

        return result;
    };
