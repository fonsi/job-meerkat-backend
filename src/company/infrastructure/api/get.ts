import { getAllCompanies } from 'company/application/getAllCompanies';
import { success } from 'shared/infrastructure/api/response';

export const companyGet = async () => {
    const companies = await getAllCompanies();

    return success(companies);
}