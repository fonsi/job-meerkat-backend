import {
    SUCCESS_RESPONSE,
    APIGatewayProxyResult,
    NOT_FOUND_RESPONSE,
    METHOD_NOT_ALLOWED_RESPONSE,
    SERVER_ERROR_RESPONSE,
    RESPONSE_HEADERS,
    RESPONSE_CODE,
} from './constants';

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

export const badRequest = (body = 'bad request'): APIGatewayProxyResult => ({
    statusCode: RESPONSE_CODE.BAD_REQUEST,
    body,
    headers: RESPONSE_HEADERS,
});

export const unauthorized = (): APIGatewayProxyResult => ({
    statusCode: RESPONSE_CODE.UNAUTHORIZED,
    body: 'unauthorized',
    headers: RESPONSE_HEADERS,
});

export const unauthorizedBody = (
    body: Record<string, unknown>,
): APIGatewayProxyResult => ({
    statusCode: RESPONSE_CODE.UNAUTHORIZED,
    body: JSON.stringify(body),
    headers: RESPONSE_HEADERS,
});

export const notFoundBody = (
    body: Record<string, unknown>,
): APIGatewayProxyResult => ({
    statusCode: RESPONSE_CODE.NOT_FOUND,
    body: JSON.stringify(body),
    headers: RESPONSE_HEADERS,
});

export const conflictBody = (
    body: Record<string, unknown>,
): APIGatewayProxyResult => ({
    statusCode: RESPONSE_CODE.CONFLICT,
    body: JSON.stringify(body),
    headers: RESPONSE_HEADERS,
});

export const methodNotAllowed = (): APIGatewayProxyResult =>
    METHOD_NOT_ALLOWED_RESPONSE;

export const serverError = (): APIGatewayProxyResult => SERVER_ERROR_RESPONSE;
