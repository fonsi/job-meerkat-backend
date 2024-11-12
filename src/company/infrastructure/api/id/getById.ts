import { getCompanyById } from 'company/application/getCompanyById';

export const companyGetById = async (event) => {
  const companyId = event?.pathParameters?.id;
  const company = await getCompanyById({ id: companyId, includeOpenJobPosts: true, });

  return {
      statusCode: 200,
      body: JSON.stringify(company),
    };
}