import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { logger } from 'shared/infrastructure/logger/logger';
import { storeJobPostPageCache } from './storeJobPostPageCache';

const CHUNK_SIZE = 8;

export const backfillJobPostPageCache = async (): Promise<{
    written: number;
    skipped: number;
}> => {
    const [jobPosts, companies] = await Promise.all([
        jobPostRepository.getAll(),
        companyRepository.getAll(),
    ]);
    const companiesById = new Map(
        companies.map((company) => [company.id, company]),
    );
    let written = 0;
    let skipped = 0;

    for (let index = 0; index < jobPosts.length; index += CHUNK_SIZE) {
        const chunk = jobPosts.slice(index, index + CHUNK_SIZE);
        const results = await Promise.all(
            chunk.map(async (jobPost) => {
                const company = companiesById.get(jobPost.companyId);
                if (!company || !jobPost.slug) {
                    logger.error(
                        new Error('Skipping job post cache backfill'),
                        { id: jobPost.id, companyId: jobPost.companyId },
                    );
                    return false;
                }

                try {
                    await storeJobPostPageCache(jobPost, company);
                    return true;
                } catch (error) {
                    logger.error(
                        error instanceof Error
                            ? error
                            : new Error(String(error)),
                        {
                            id: jobPost.id,
                            slug: jobPost.slug,
                            companyId: jobPost.companyId,
                        },
                    );
                    return false;
                }
            }),
        );
        written += results.filter(Boolean).length;
        skipped += results.filter((wrote) => !wrote).length;
        console.log(
            `Job post cache backfill ${written + skipped} / ${jobPosts.length}`,
        );
    }

    return { written, skipped };
};
