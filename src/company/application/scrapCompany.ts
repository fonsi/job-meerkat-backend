import { CompanyId } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';
import {
    buildCompanyScrapper,
    ScrappedJobPost,
} from 'company/infrastructure/scrapping/companyScrapper';

type ScrappeCompanyCommand = {
    companyId: CompanyId;
};

export const scrapCompany = async ({
    companyId,
}: ScrappeCompanyCommand): Promise<ScrappedJobPost[]> => {
    const company = await companyRepository.getById(companyId);

    if (!company) {
        throw new Error(`Company not found - ${companyId}`);
    }

    const scrap = buildCompanyScrapper({ company });

    return await scrap();
};
