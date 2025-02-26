import 'source-map-support/register';
import {
    methodNotAllowed,
    serverError,
} from 'shared/infrastructure/api/response';
import { HTTP_METHOD } from 'shared/infrastructure/api/constants';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { logger } from 'shared/infrastructure/logger/logger';
import { socialSchedulePost } from './post';

export const index = async (event) => {
    try {
        const method = event?.requestContext?.http?.method;

        switch (method) {
            case HTTP_METHOD.POST:
                return await socialSchedulePost();
        }

        return methodNotAllowed();
    } catch (e) {
        const error = errorWithPrefix(e, 'schedule social posts');
        logger.error(error);
        await logger.wait();

        return serverError();
    }
};
