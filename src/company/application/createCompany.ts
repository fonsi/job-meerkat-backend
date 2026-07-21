import {
    createCompany as createCompanyEntity,
    Company,
} from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';

type CreateCompanyCommand = {
    name: string;
    homePage: string;
    description?: string;
};

export const createCompany = async ({
    name,
    homePage,
    description,
}: CreateCompanyCommand): Promise<Company> => {
    const company = createCompanyEntity({ name, homePage, description });

    return await companyRepository.create(company);
};
