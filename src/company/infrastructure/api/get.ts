import { getAllCompanies } from 'company/application/getAllCompanies';
import { success } from 'shared/infrastructure/api/response';

type QueryParams = {
    countJobPosts?: string;
};

export const companyGet = async (event) => {
    const { countJobPosts } = (event?.queryStringParameters ||
        {}) as QueryParams;
    const companies = await getAllCompanies({
        countJobPosts: countJobPosts === '1',
    });

    return success(companies);
};
