import { getCompanyById } from 'company/application/getCompanyById';
import { success } from 'shared/infrastructure/api/response';

export const companyGetById = async (event) => {
    const companyId = event?.pathParameters?.id;
    const company = await getCompanyById({
        id: companyId,
        includeOpenJobPosts: true,
    });

    return success(company);
};
