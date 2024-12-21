import 'source-map-support/register';
import { jobPostGet } from './get';
import {
    methodNotAllowed,
    serverError,
} from 'shared/infrastructure/api/response';
import { HTTP_METHOD } from 'shared/infrastructure/api/constants';

export const index = async (event) => {
    try {
        const method = event?.requestContext?.http?.method;

        switch (method) {
            case HTTP_METHOD.GET:
                return await jobPostGet();
        }

        return methodNotAllowed();
    } catch (e) {
        console.log(`[Error]: ${e.message}`);

        return serverError();
    }
};
