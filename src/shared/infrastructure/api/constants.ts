export type APIGatewayProxyResult = {
    statusCode: number;
    body: string;
    headers: Record<string, string | boolean | number>;
};

export enum HTTP_METHOD {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    DELETE = 'DELETE',
}

export const RESPONSE_CODE = {
    SUCCESS: 200,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_ERROR: 500,
};

export const RESPONSE_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
};

export const SUCCESS_RESPONSE: APIGatewayProxyResult = {
    statusCode: RESPONSE_CODE.SUCCESS,
    body: 'success',
    headers: RESPONSE_HEADERS,
};

export const NOT_FOUND_RESPONSE: APIGatewayProxyResult = {
    statusCode: RESPONSE_CODE.NOT_FOUND,
    body: 'not found',
    headers: RESPONSE_HEADERS,
};

export const METHOD_NOT_ALLOWED_RESPONSE: APIGatewayProxyResult = {
    statusCode: RESPONSE_CODE.METHOD_NOT_ALLOWED,
    body: 'method not allowed',
    headers: RESPONSE_HEADERS,
};

export const SERVER_ERROR_RESPONSE: APIGatewayProxyResult = {
    statusCode: RESPONSE_CODE.INTERNAL_ERROR,
    body: 'server error',
    headers: RESPONSE_HEADERS,
};
