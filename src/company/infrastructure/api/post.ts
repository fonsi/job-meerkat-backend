import { APIGatewayProxyEvent } from 'aws-lambda';
import { createCompany } from 'company/application/createCompany';

type Params = {
    name: string;
    homePage: string;
}

export const companyPost = async (event: APIGatewayProxyEvent) => {
    const { name, homePage } = JSON.parse(event.body) as Params;

    const company = await createCompany({ name, homePage });

    return {
        statusCode: 200,
        body: JSON.stringify({
          company,
        }),
      };
}