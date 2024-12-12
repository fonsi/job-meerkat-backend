import { SUCCESS_RESPONSE, APIGatewayProxyResult, NOT_FOUND_RESPONSE, METHOD_NOT_ALLOWED_RESPONSE, SERVER_ERROR_RESPONSE } from './constants';

export const success = (result: unknown): APIGatewayProxyResult => {
  let body: string;

  try {
    body = JSON.stringify(result);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    body = result as string;
  }

  return {
    ...SUCCESS_RESPONSE,
    body,
  };
};

export const notFound = (): APIGatewayProxyResult => NOT_FOUND_RESPONSE;

export const methodNotAllowed = (): APIGatewayProxyResult => METHOD_NOT_ALLOWED_RESPONSE;

export const serverError = (): APIGatewayProxyResult => SERVER_ERROR_RESPONSE;
