import { scrapCompany } from 'company/application/scrapCompany';
import { initializeLogger } from 'shared/infrastructure/logger/logger';
import { companyRepository } from '../persistance/dynamodb/dynamodbCompanyRepository';
import {
    getNewCompanyScrapper,
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

    let scrappedJobPosts: ScrappedJobPost[] = [];
    if (newScrapper) {
        const builtScrapper = newScrapper({ companyId });
        const listedJobPostsData = await builtScrapper.getListedJobPostsData();
        const jobPostsToScrap = limit
            ? listedJobPostsData.slice(0, limit)
            : listedJobPostsData;

        console.log(
            `[LISTED: ${listedJobPostsData.length}] [SCRAPPING: ${jobPostsToScrap.length}]`,
        );

        scrappedJobPosts = await builtScrapper.scrapJobPost(jobPostsToScrap);
    } else {
        scrappedJobPosts = await scrapCompany({ company });
    }

    console.log(scrappedJobPosts);
};
