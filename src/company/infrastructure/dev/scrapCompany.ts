import { scrapCompany } from 'company/application/scrapCompany';
import { initializeLogger } from 'shared/infrastructure/logger/logger';

initializeLogger();

/*
    function used in development to build scrappers
*/
export const index = async (event) => {
    const companyId = event.body;
    const scrappedJobPosts = await scrapCompany({ companyId });

    console.log(scrappedJobPosts);
};
