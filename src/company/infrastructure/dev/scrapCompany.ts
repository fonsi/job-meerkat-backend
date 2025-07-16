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
    const company = await companyRepository.getById(companyId);

    if (!company) {
        throw new Error(`Company not found - ${companyId}`);
    }

    const newScrapper = getNewCompanyScrapper(company);

    let scrappedJobPosts: ScrappedJobPost[] = [];
    if (newScrapper) {
        const builtScrapper = newScrapper({ companyId });
        const listedJobPostsData = await builtScrapper.getListedJobPostsData();
        scrappedJobPosts = await builtScrapper.scrapJobPost(listedJobPostsData);
    } else {
        scrappedJobPosts = await scrapCompany({ company });
    }

    console.log(scrappedJobPosts);
};
