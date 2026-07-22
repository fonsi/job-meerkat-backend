import { Company, CompanyId, isCompanyDisabled } from 'company/domain/company';
import { scrapCompany } from './scrapCompany';
import { createJobPost } from 'jobPost/application/createJobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { isOpen, JobPost } from 'jobPost/domain/jobPost';
import {
    getNewCompanyScrapper,
    NewCompanyScrapper,
    ListedJobPostsData,
    ScrappedJobPost,
} from 'company/infrastructure/scrapping/companyScrapper';
import { closeJobPost } from 'jobPost/application/closeJobPost';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import { logger } from 'shared/infrastructure/logger/logger';

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

const MAX_JOB_POSTS_TO_SCRAP = 50;

const getNewAndClosedJobPosts = ({
    scrappedJobPosts,
    openJobPosts,
}: GetNewAndClosedJobPostsData): NewAndClosedJobPosts => {
    const newJobPosts = scrappedJobPosts.filter(
        (scrappedJobPost) =>
            !openJobPosts.find(
                (openJobPosts) =>
                    openJobPosts.originalId === scrappedJobPost.originalId,
            ),
    );
    const closedJobPosts = openJobPosts.filter(
        (openJobPost) =>
            !scrappedJobPosts.find(
                (scrappedJobPost) =>
                    scrappedJobPost.originalId === openJobPost.originalId,
            ),
    );

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

    console.log(
        `[SCRAPPED: ${scrappedJobPosts.length}] [OPEN: ${openJobPosts.length}] [NEW: ${newJobPosts.length}] [CLOSED: ${closedJobPosts.length}]`,
    );

    const createJobPostsPromises: Promise<JobPost>[] = newJobPosts.map(
        (jobPost) =>
            createJobPost({
                ...jobPost,
                company,
            }),
    );
    const closeJobPostsPromises: Promise<void>[] =
        closedJobPosts.map(closeJobPost);

    await Promise.all([...createJobPostsPromises, ...closeJobPostsPromises]);
};

const newGetNewAndClosedJobPosts = ({
    listedJobPostsData,
    openJobPosts,
}: NewGetNewAndClosedJobPostsData): NewNewAndClosedJobPosts => {
    const newJobPosts = listedJobPostsData.filter(
        (listedJobPostsData) =>
            !openJobPosts.find(
                (openJobPosts) =>
                    openJobPosts.originalId === listedJobPostsData.id,
            ),
    );
    const closedJobPosts = openJobPosts.filter(
        (openJobPost) =>
            !listedJobPostsData.find(
                (listedJobPostsData) =>
                    listedJobPostsData.id === openJobPost.originalId,
            ),
    );

    return {
        newJobPosts,
        closedJobPosts,
    };
};

const scrapUsingNewScrapper = async ({
    companyId,
    company,
    scrapper,
}: NewScrapperData): Promise<void> => {
    const builtScrapper = scrapper({ companyId });
    const listedJobPostsData = await builtScrapper.getListedJobPostsData();
    const companyJobPosts =
        await jobPostRepository.getAllByCompanyId(companyId);
    const openJobPosts = companyJobPosts.filter(isOpen);
    const closedJobPostByOriginalId = companyJobPosts
        .filter((jobPost) => !isOpen(jobPost))
        .reduce((currentMap, jobPost) => {
            const existing = currentMap.get(jobPost.originalId);

            if (
                !existing ||
                (existing.closedAt || 0) < (jobPost.closedAt || 0)
            ) {
                currentMap.set(jobPost.originalId, jobPost);
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
        logger.info(
            `Too many new job posts to scrap for ${company.name}, scraping only ${MAX_JOB_POSTS_TO_SCRAP} of ${newJobPosts.length}`,
        );
    }

    const newJobPostsToScrap = newJobPosts.slice(0, MAX_JOB_POSTS_TO_SCRAP);

    const scrappedJobPosts =
        await builtScrapper.scrapJobPost(newJobPostsToScrap);

    const createJobPosts: ScrappedJobPost[] = [];
    const reopenJobPosts: JobPost[] = [];

    scrappedJobPosts.forEach((scrappedJobPost) => {
        const closedJobPost = closedJobPostByOriginalId.get(
            scrappedJobPost.originalId,
        );

        if (!closedJobPost) {
            createJobPosts.push(scrappedJobPost);
            return;
        }

        reopenJobPosts.push({
            ...closedJobPost,
            ...scrappedJobPost,
            originalId: closedJobPost.originalId,
            closedAt: null,
            createdAt: scrappedJobPost.createdAt || Date.now(),
        });
    });

    console.log(
        `[LISTED: ${listedJobPostsData.length}] [OPEN: ${openJobPosts.length}] [NEW: ${newJobPosts.length}] [REOPENED: ${reopenJobPosts.length}] [CREATED: ${createJobPosts.length}] [CLOSED: ${closedJobPosts.length}]`,
    );

    const createJobPostsPromises: Promise<JobPost>[] = createJobPosts.map(
        (jobPost) =>
            createJobPost({
                ...jobPost,
                company,
            }),
    );
    const reopenJobPostsPromises: Promise<JobPost>[] = reopenJobPosts.map(
        (jobPost) => jobPostRepository.update(jobPost),
    );
    const closeJobPostsPromises: Promise<void>[] =
        closedJobPosts.map(closeJobPost);

    await Promise.all([
        ...createJobPostsPromises,
        ...reopenJobPostsPromises,
        ...closeJobPostsPromises,
    ]);
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
