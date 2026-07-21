import { createCompany } from 'company/application/createCompany';
import { success } from 'shared/infrastructure/api/response';

type Params = {
    name: string;
    homePage: string;
    description?: string;
};

export const companyPost = async (event) => {
    const { name, homePage, description } = JSON.parse(event.body) as Params;

    const company = await createCompany({ name, homePage, description });

    return success(company);
};
