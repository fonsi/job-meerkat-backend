import { Company } from 'company/domain/company';
import {
    buildCompanyScrapper,
    ScrappedJobPost,
} from 'company/infrastructure/scrapping/companyScrapper';
import { logger } from 'shared/infrastructure/logger/logger';

type ScrappeCompanyCommand = {
    company: Company;
};

export const scrapCompany = async ({
    company,
}: ScrappeCompanyCommand): Promise<ScrappedJobPost[]> => {
    const scrap = buildCompanyScrapper({ company });

    const scrappedJobPosts = await scrap();

    if (!scrappedJobPosts || scrappedJobPosts.length === 0) {
        logger.info(`No open positions in ${company.name}`);
    }

    return scrappedJobPosts;
};
