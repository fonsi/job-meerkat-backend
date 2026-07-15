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
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    METHOD_NOT_ALLOWED: 405,
    INTERNAL_ERROR: 500,
};

export const RESPONSE_HEADERS = {
    'Access-Control-Allow-Origin': '*',
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

export const BAD_REQUEST_RESPONSE: APIGatewayProxyResult = {
    statusCode: RESPONSE_CODE.BAD_REQUEST,
    body: 'bad request',
    headers: RESPONSE_HEADERS,
};

export const UNAUTHORIZED_RESPONSE: APIGatewayProxyResult = {
    statusCode: RESPONSE_CODE.UNAUTHORIZED,
    body: 'unauthorized',
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
