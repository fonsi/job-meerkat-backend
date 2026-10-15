import { scrapCompany } from 'company/application/scrapCompany';
import { initializeLogger } from 'shared/infrastructure/logger/logger';
import { companyRepository } from '../persistance/dynamodb/dynamodbCompanyRepository';
import { writeSampleJobs } from '../admin/pendingArtifacts';
import {
    getNewCompanyScrapper,
    ListedJobPostsData,
    ScrappedJobPost,
} from '../scrapping/companyScrapper';

initializeLogger();

/*
    function used in development to build scrappers
*/
export const index = async (event) => {
    const companyId = event.body;
    const limit = typeof event.limit === 'number' ? event.limit : undefined;
    const company = await companyRepository.getById(companyId);

    if (!company) {
        throw new Error(`Company not found - ${companyId}`);
    }

    const newScrapper = getNewCompanyScrapper(company);

    let listedJobPostsData: ListedJobPostsData[] = [];
    let scrappedJobPosts: ScrappedJobPost[] = [];
    if (newScrapper) {
        const builtScrapper = newScrapper({ companyId });
        listedJobPostsData = await builtScrapper.getListedJobPostsData();
        const jobPostsToScrap = limit
            ? listedJobPostsData.slice(0, limit)
            : listedJobPostsData;

        console.log(
            `[LISTED: ${listedJobPostsData.length}] [SCRAPPING: ${jobPostsToScrap.length}]`,
        );

        scrappedJobPosts = await builtScrapper.scrapJobPost(jobPostsToScrap);
    } else {
        scrappedJobPosts = await scrapCompany({ company });
        listedJobPostsData = scrappedJobPosts.map((job) => ({
            id: job.originalId,
            url: job.url,
            title: job.title,
            createdAt: job.createdAt ?? undefined,
        }));
    }

    try {
        writeSampleJobs({
            companyId,
            listedCount: listedJobPostsData.length,
            listedTitles: listedJobPostsData.map((job) => job.title),
            sampledAt: new Date().toISOString(),
            sampleSize: scrappedJobPosts.length,
            jobs: scrappedJobPosts,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Could not write sample jobs: ${message}`);
    }

    console.log(scrappedJobPosts);
};
