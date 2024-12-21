import { Company } from 'company/domain/company';
import { companyRepository } from 'company/infrastructure/persistance/dynamodb/dynamodbCompanyRepository';

export const getAllCompanies = async (): Promise<Company[]> =>
    companyRepository.getAll();
