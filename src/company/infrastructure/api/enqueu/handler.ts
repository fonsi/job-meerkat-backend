import 'source-map-support/register';
import { APIGatewayProxyHandler } from 'aws-lambda';
import { scheduleCompaniesToProcess } from 'company/application/scheduleCompaniesToProcess';

export const index: APIGatewayProxyHandler = async () => {
  try {
    await scheduleCompaniesToProcess();
  } catch (e) {
    console.log(`[Error]: ${e.message}`);

    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Something went wrong',
      }),
    };
  }
};
