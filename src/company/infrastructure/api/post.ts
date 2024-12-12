import { createCompany } from 'company/application/createCompany';
import { success } from 'shared/infrastructure/api/response';

type Params = {
    name: string;
    homePage: string;
}

export const companyPost = async (event) => {
    const { name, homePage } = JSON.parse(event.body) as Params;

    const company = await createCompany({ name, homePage });

    return success(company);
}