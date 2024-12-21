import { CompanyId } from 'company/domain/company';
import { scrapCompany } from './scrapCompany';
import { createJobPost } from 'jobPost/application/createJobPost';
import { jobPostRepository } from 'jobPost/infrastructure/persistance/dynamodb/dynamodbJobPostRepository';
import { JobPost } from 'jobPost/domain/jobPost';
import { ScrappedJobPost } from 'company/infrastructure/scrapping/companyScrapper';
import { closeJobPost } from 'jobPost/application/closeJobPost';

type ProcessCompanyCommand = {
    companyId: CompanyId;
};

type GetNewAndClosedJobPostsData = {
    scrappedJobPosts: ScrappedJobPost[];
    openJobPosts: JobPost[];
};

type NewAndClosedJobPosts = {
    newJobPosts: ScrappedJobPost[];
    closedJobPosts: JobPost[];
};

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

export const processCompany = async ({
    companyId,
}: ProcessCompanyCommand): Promise<void> => {
    console.log('[PROCESS COMPANY]', companyId);

    const scrappedJobPosts = await scrapCompany({ companyId });
    const openJobPosts =
        await jobPostRepository.getAllOpenByCompanyId(companyId);

    const { newJobPosts, closedJobPosts } = getNewAndClosedJobPosts({
        scrappedJobPosts,
        openJobPosts,
    });

    console.log(
        `[SCRAPPED: ${scrappedJobPosts.length}] [OPEN: ${openJobPosts.length}] [NEW: ${newJobPosts.length}] [CLOSED: ${closedJobPosts.length}]`,
    );

    const createJobPostsPromises: Promise<void>[] =
        newJobPosts.map(createJobPost);
    const closeJobPostsPromises: Promise<void>[] =
        closedJobPosts.map(closeJobPost);

    await Promise.all([...createJobPostsPromises, ...closeJobPostsPromises]);
};
