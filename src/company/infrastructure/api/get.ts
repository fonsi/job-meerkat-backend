import { getAllCompanies } from 'company/application/getAllCompanies';

export const companyGet = async () => {
    const companies = await getAllCompanies();

    return {
        statusCode: 200,
        body: JSON.stringify(companies),
      };
}