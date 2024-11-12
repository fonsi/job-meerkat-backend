import 'source-map-support/register';
import { jobPostGet } from './get';

export const index = async (event) => {
  try {
    const method = event?.requestContext?.http?.method;

    switch(method) {
      case 'GET':
        return await jobPostGet();
    }

    return {
      statusCode: 401,
      body: JSON.stringify({
        message: 'Bad request',
      }),
    };
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
