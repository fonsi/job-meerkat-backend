import 'source-map-support/register';
import { jobPostGetBySlug } from './getBySlug';
import {
    methodNotAllowed,
    serverError,
} from 'shared/infrastructure/api/response';
import { HTTP_METHOD } from 'shared/infrastructure/api/constants';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';

export const index = async (event) => {
    initializeLogger();

    try {
        const method = event?.requestContext?.http?.method;

        switch (method) {
            case HTTP_METHOD.GET:
                return await jobPostGetBySlug(event);
        }

        return methodNotAllowed();
    } catch (e) {
        const error = errorWithPrefix(e, 'Get job post by slug');

        logger.error(error);

        await logger.wait();

        return serverError();
    }
};
