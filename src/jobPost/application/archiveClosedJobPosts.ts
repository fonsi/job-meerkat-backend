import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { deleteJobPostPageCache } from 'jobPost/infrastructure/cache/s3/deleteJobPostPageCache';

const TWO_MONTHS_IN_MS = 1000 * 60 * 60 * 24 * 30 * 2;

type ArchiveClosedJobPostsResult = {
    scanned: number;
    moved: number;
    failed: number;
};

export const getArchiveClosedBefore = (now: number = Date.now()): number =>
    now - TWO_MONTHS_IN_MS;

export const archiveClosedJobPosts =
    async (): Promise<ArchiveClosedJobPostsResult> => {
        const closedBefore = getArchiveClosedBefore();
        const candidates =
            await jobPostRepository.getAllClosedBefore(closedBefore);

        let moved = 0;
        let failed = 0;

        for (const jobPost of candidates) {
            try {
                await jobPostRepository.moveClosedToArchive(
                    jobPost,
                    closedBefore,
                );
                await deleteJobPostPageCache(jobPost.slug);
                moved += 1;
            } catch (e) {
                failed += 1;
                console.log(
                    `[ARCHIVE CLOSED JOB POSTS] failed moving ${jobPost.id}/${jobPost.companyId}: ${e.message}`,
                );
            }
        }

        return {
            scanned: candidates.length,
            moved,
            failed,
        };
    };
