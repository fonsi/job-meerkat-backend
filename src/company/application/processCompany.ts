import { Company, CompanyId, isCompanyDisabled } from 'company/domain/company';
import { scrapCompany } from './scrapCompany';
import { createJobPost } from 'jobPost/application/createJobPost';
import { enqueueJobPostOgImage } from 'jobPost/infrastructure/queue/sqs/enqueue';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import {
    hasAnalyzedJobPostFields,
    isOpen,
    JobPost,
    normalizeSalaryRange,
} from 'jobPost/domain/jobPost';
import {
    getNewCompanyScrapper,
    NewCompanyScrapper,
    ListedJobPostsData,
    ScrappedJobPost,
} from 'company/infrastructure/scrapping/companyScrapper';
import { closeJobPost } from 'jobPost/application/closeJobPost';
import { storeJobPostPageCache } from 'jobPost/application/storeJobPostPageCache';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { logger } from 'shared/infrastructure/logger/logger';
import { isJobListingUnavailableError } from 'company/infrastructure/scrapping/jobListingUnavailableError';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';

type ProcessCompanyCommand = {
    companyId: CompanyId;
};

type GetNewAndClosedJobPostsData = {
    scrappedJobPosts: ScrappedJobPost[];
    openJobPosts: JobPost[];
};

type NewGetNewAndClosedJobPostsData = {
    listedJobPostsData: ListedJobPostsData[];
    openJobPosts: JobPost[];
};

type NewAndClosedJobPosts = {
    newJobPosts: ScrappedJobPost[];
    closedJobPosts: JobPost[];
};

type NewNewAndClosedJobPosts = {
    newJobPosts: ListedJobPostsData[];
    closedJobPosts: JobPost[];
};

type NewScrapperData = {
    companyId: CompanyId;
    company: Company;
    scrapper: NewCompanyScrapper;
};

type OldScrapperData = {
    companyId: CompanyId;
    company: Company;
};

type PersistOperation = {
    label: string;
    title?: string;
    url?: string;
    run: () => Promise<void>;
};

const MAX_JOB_POSTS_TO_SCRAP = 50;

const toJobPostKey = (id: unknown): string | null => {
    if (id === null || id === undefined) return null;
    const key = String(id).trim();
    return key.length ? key : null;
};

const enqueueOgImage = (jobPost: JobPost): Promise<void> =>
    enqueueJobPostOgImage({
        companyId: jobPost.companyId,
        jobPostId: jobPost.id,
    });

const toError = (reason: unknown): Error =>
    reason instanceof Error ? reason : new Error(String(reason));

const runPersistOperations = async (
    company: Company,
    operations: PersistOperation[],
): Promise<{ fulfilled: number; failed: number }> => {
    const results = await Promise.allSettled(
        operations.map((operation) => operation.run()),
    );

    let fulfilled = 0;
    let failed = 0;

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            fulfilled += 1;
            return;
        }

        failed += 1;
        const operation = operations[index];
        const error = errorWithPrefix(
            toError(result.reason),
            `Failed to ${operation.label} job post for ${company.name}`,
        );

        console.error(error.message, {
            companyId: company.id,
            title: operation.title,
            url: operation.url,
        });
        logger.error(error, {
            companyId: company.id,
            title: operation.title,
            url: operation.url,
        });
    });

    return { fulfilled, failed };
};

const getNewAndClosedJobPosts = ({
    scrappedJobPosts,
    openJobPosts,
}: GetNewAndClosedJobPostsData): NewAndClosedJobPosts => {
    const openIds = new Set(
        openJobPosts
            .map((p) => toJobPostKey(p.originalId))
            .filter((key): key is string => key !== null),
    );
    const scrappedIds = new Set(
        scrappedJobPosts
            .map((p) => toJobPostKey(p.originalId))
            .filter((key): key is string => key !== null),
    );

    const newJobPosts = scrappedJobPosts.filter((scrappedJobPost) => {
        const key = toJobPostKey(scrappedJobPost.originalId);
        return key !== null && !openIds.has(key);
    });
    const closedJobPosts = openJobPosts.filter((openJobPost) => {
        const key = toJobPostKey(openJobPost.originalId);
        return key === null || !scrappedIds.has(key);
    });

    return {
        newJobPosts,
        closedJobPosts,
    };
};

const scrapUsingOldScrapper = async ({
    companyId,
    company,
}: OldScrapperData): Promise<void> => {
    const scrappedJobPosts = await scrapCompany({ company });
    const openJobPosts =
        await jobPostRepository.getAllOpenByCompanyId(companyId);

    const { newJobPosts, closedJobPosts } = getNewAndClosedJobPosts({
        scrappedJobPosts,
        openJobPosts,
    });

    const createJobPosts = newJobPosts.filter(hasAnalyzedJobPostFields);

    const createOperations: PersistOperation[] = createJobPosts.map(
        (jobPost) => ({
            label: 'create',
            title: jobPost.title,
            url: jobPost.url,
            run: () =>
                createJobPost({
                    ...jobPost,
                    company,
                }).then(enqueueOgImage),
        }),
    );
    const closeOperations: PersistOperation[] = closedJobPosts.map(
        (jobPost) => ({
            label: 'close',
            title: jobPost.title,
            url: jobPost.url,
            run: () => closeJobPost(jobPost),
        }),
    );

    const createResults = await runPersistOperations(company, createOperations);
    const closeResults = await runPersistOperations(company, closeOperations);
    const failed = createResults.failed + closeResults.failed;

    console.log(
        `[SCRAPPED: ${scrappedJobPosts.length}] [OPEN: ${openJobPosts.length}] [NEW: ${newJobPosts.length}] [CREATED: ${createResults.fulfilled}] [CLOSED: ${closeResults.fulfilled}] [FAILED: ${failed}]`,
    );

    if (failed > 0) {
        throw new Error(
            `Failed to persist ${failed} job post(s) for ${company.name}`,
        );
    }
};

const newGetNewAndClosedJobPosts = ({
    listedJobPostsData,
    openJobPosts,
}: NewGetNewAndClosedJobPostsData): NewNewAndClosedJobPosts => {
    const openIds = new Set(
        openJobPosts
            .map((p) => toJobPostKey(p.originalId))
            .filter((key): key is string => key !== null),
    );
    const listedIds = new Set(
        listedJobPostsData
            .map((l) => toJobPostKey(l.id))
            .filter((key): key is string => key !== null),
    );

    const newJobPosts = listedJobPostsData.filter((listed) => {
        const key = toJobPostKey(listed.id);
        return key !== null && !openIds.has(key);
    });
    const closedJobPosts = openJobPosts.filter((openJobPost) => {
        const key = toJobPostKey(openJobPost.originalId);
        return key === null || !listedIds.has(key);
    });

    return {
        newJobPosts,
        closedJobPosts,
    };
};

const normalizeListedJobPostsData = (
    listedJobPostsData: ListedJobPostsData[],
    company: Company,
): ListedJobPostsData[] => {
    const normalized: ListedJobPostsData[] = [];

    for (const listed of listedJobPostsData) {
        const key = toJobPostKey(listed.id);
        if (key === null) {
            logger.info(
                `Skipping listed job post with missing id for ${company.name}`,
                {
                    companyId: company.id,
                    title: listed.title,
                    url: listed.url,
                },
            );
            continue;
        }

        normalized.push({ ...listed, id: key });
    }

    return normalized;
};

const scrapUsingNewScrapper = async ({
    companyId,
    company,
    scrapper,
}: NewScrapperData): Promise<void> => {
    const builtScrapper = scrapper({ companyId });
    let listedJobPostsData: ListedJobPostsData[];

    try {
        listedJobPostsData = normalizeListedJobPostsData(
            await builtScrapper.getListedJobPostsData(),
            company,
        );
    } catch (e) {
        if (isJobListingUnavailableError(e)) {
            logger.info(`Skipping ${company.name}: job listing unavailable`, {
                companyId,
                error: e instanceof Error ? e.message : String(e),
            });
            return;
        }

        throw e;
    }

    const companyJobPosts =
        await jobPostRepository.getAllByCompanyId(companyId);
    const openJobPosts = companyJobPosts.filter(isOpen);
    const closedJobPostByOriginalId = companyJobPosts
        .filter((jobPost) => !isOpen(jobPost))
        .reduce((currentMap, jobPost) => {
            const key = toJobPostKey(jobPost.originalId);
            if (key === null) return currentMap;

            const existing = currentMap.get(key);

            if (
                !existing ||
                (existing.closedAt || 0) < (jobPost.closedAt || 0)
            ) {
                currentMap.set(key, jobPost);
            }

            return currentMap;
        }, new Map<string, JobPost>());

    if (listedJobPostsData.length === 0) {
        logger.info(`No open positions in ${company.name}`);
    }

    const { newJobPosts, closedJobPosts } = newGetNewAndClosedJobPosts({
        listedJobPostsData,
        openJobPosts,
    });

    if (newJobPosts.length > MAX_JOB_POSTS_TO_SCRAP) {
        const message = `Too many new job posts to scrap for ${company.name}, scraping only ${MAX_JOB_POSTS_TO_SCRAP} of ${newJobPosts.length}`;
        console.warn(message);
        logger.info(message);
    }

    const newJobPostsToScrap = newJobPosts.slice(0, MAX_JOB_POSTS_TO_SCRAP);

    const scrappedJobPosts =
        await builtScrapper.scrapJobPost(newJobPostsToScrap);

    const createJobPosts: ScrappedJobPost[] = [];
    const reopenJobPosts: JobPost[] = [];

    scrappedJobPosts.forEach((scrappedJobPost) => {
        if (!hasAnalyzedJobPostFields(scrappedJobPost)) {
            logger.info(
                `Skipping incomplete scraped job post for ${company.name}`,
                {
                    companyId,
                    originalId: scrappedJobPost.originalId,
                },
            );
            return;
        }

        const closedJobPostKey = toJobPostKey(scrappedJobPost.originalId);
        const closedJobPost = closedJobPostKey
            ? closedJobPostByOriginalId.get(closedJobPostKey)
            : undefined;
        const salaryRange = normalizeSalaryRange(scrappedJobPost.salaryRange);

        if (!closedJobPost) {
            createJobPosts.push({
                ...scrappedJobPost,
                salaryRange,
            });
            return;
        }

        reopenJobPosts.push({
            ...closedJobPost,
            ...scrappedJobPost,
            salaryRange,
            originalId: closedJobPost.originalId,
            closedAt: null,
            createdAt: scrappedJobPost.createdAt || Date.now(),
        });
    });

    const createOperations: PersistOperation[] = createJobPosts.map(
        (jobPost) => ({
            label: 'create',
            title: jobPost.title,
            url: jobPost.url,
            run: () =>
                createJobPost({
                    ...jobPost,
                    company,
                }).then(enqueueOgImage),
        }),
    );
    const reopenOperations: PersistOperation[] = reopenJobPosts.map(
        (jobPost) => ({
            label: 'reopen',
            title: jobPost.title,
            url: jobPost.url,
            run: () =>
                jobPostRepository.update(jobPost).then(async (saved) => {
                    const pageJob = saved ?? jobPost;
                    await storeJobPostPageCache(pageJob, company);
                    await enqueueOgImage(pageJob);
                }),
        }),
    );
    const closeOperations: PersistOperation[] = closedJobPosts.map(
        (jobPost) => ({
            label: 'close',
            title: jobPost.title,
            url: jobPost.url,
            run: () => closeJobPost(jobPost),
        }),
    );

    const createResults = await runPersistOperations(company, createOperations);
    const reopenResults = await runPersistOperations(company, reopenOperations);
    const closeResults = await runPersistOperations(company, closeOperations);

    const failed =
        createResults.failed + reopenResults.failed + closeResults.failed;

    console.log(
        `[LISTED: ${listedJobPostsData.length}] [OPEN: ${openJobPosts.length}] [NEW: ${newJobPosts.length}] [REOPENED: ${reopenResults.fulfilled}] [CREATED: ${createResults.fulfilled}] [CLOSED: ${closeResults.fulfilled}] [FAILED: ${failed}]`,
    );

    if (failed > 0) {
        throw new Error(
            `Failed to persist ${failed} job post(s) for ${company.name}`,
        );
    }
};

export const processCompany = async ({
    companyId,
}: ProcessCompanyCommand): Promise<void> => {
    console.log('[PROCESS COMPANY]', companyId);

    const company = await companyRepository.getById(companyId);

    if (!company) {
        throw new Error(`Company not found - ${companyId}`);
    }

    if (isCompanyDisabled(company)) {
        console.log('[PROCESS COMPANY] Skipping disabled company', companyId);
        return;
    }

    const newScrapper = getNewCompanyScrapper(company);

    if (newScrapper) {
        console.log('[NEW SCRAPPER]');
        await scrapUsingNewScrapper({
            companyId,
            company,
            scrapper: newScrapper,
        });
    } else {
        console.log('[OLD SCRAPPER]');
        await scrapUsingOldScrapper({ companyId, company });
    }
};
