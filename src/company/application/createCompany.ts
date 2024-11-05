import { createCompany as createCompanyEntity, Company } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';

type CreateCompanyCommand = {
    name: string;
    homePage: string;
}

export const createCompany = async ({ name, homePage }: CreateCompanyCommand): Promise<Company> => {
    const company = createCompanyEntity({ name, homePage });

    return await companyRepository.create(company);
}