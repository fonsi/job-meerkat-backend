import 'source-map-support/register';
import { companyPost } from './post';

export const index = async (event) => {
  try {
    const method = event?.httpMethod;

    switch(method) {
      case 'POST':
        return await companyPost(event);
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
