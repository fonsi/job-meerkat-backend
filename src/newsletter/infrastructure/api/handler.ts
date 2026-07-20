import 'source-map-support/register';
import { confirmNewsletter } from 'newsletter/application/confirmNewsletter';
import { getNewsletterPreferences } from 'newsletter/application/getNewsletterPreferences';
import { previewUnsubscribe } from 'newsletter/application/previewUnsubscribe';
import { putNewsletterPreferences } from 'newsletter/application/putNewsletterPreferences';
import { requestNewsletterLink } from 'newsletter/application/requestNewsletterLink';
import { subscribeNewsletter } from 'newsletter/application/subscribeNewsletter';
import {
    requestUnsubscribeLink,
    unsubscribeNewsletter,
} from 'newsletter/application/unsubscribeNewsletter';
import { HTTP_METHOD } from 'shared/infrastructure/api/constants';
import {
    badRequest,
    conflictBody,
    methodNotAllowed,
    notFoundBody,
    serverError,
    success,
    unauthorizedBody,
} from 'shared/infrastructure/api/response';
import { errorWithPrefix } from 'shared/infrastructure/logger/errorWithPrefix';
import { initializeLogger, logger } from 'shared/infrastructure/logger/logger';

const pathEndsWith = (path: string, suffix: string) =>
    path.endsWith(suffix) || path.includes(suffix);

export const index = async (event) => {
    try {
        initializeLogger();

        const method = event?.requestContext?.http?.method as
            | string
            | undefined;
        const path = event?.requestContext?.http?.path ?? '';
        const query = event?.queryStringParameters ?? {};

        if (
            method === HTTP_METHOD.POST &&
            pathEndsWith(path, '/newsletter/subscribe')
        ) {
            await subscribeNewsletter(event);
            return success({ ok: true });
        }

        if (
            method === HTTP_METHOD.POST &&
            pathEndsWith(path, '/newsletter/confirm')
        ) {
            const result = await confirmNewsletter(event);
            if (result.ok === false) {
                logger.info('newsletter/confirm failed', {
                    reason: result.reason,
                });
                await logger.wait();
                return unauthorizedBody({ error: result.reason });
            }
            return success({ preferencesToken: result.preferencesToken });
        }

        if (
            method === HTTP_METHOD.POST &&
            pathEndsWith(path, '/newsletter/request-link')
        ) {
            await requestNewsletterLink(event);
            return success({ ok: true });
        }

        if (
            method === HTTP_METHOD.GET &&
            pathEndsWith(path, '/newsletter/unsubscribe/preview')
        ) {
            const result = await previewUnsubscribe(query.t);
            if (result.ok === false) {
                if (result.reason === 'already_unsubscribed') {
                    return conflictBody({ error: result.reason });
                }
                return notFoundBody({ error: result.reason });
            }
            return success({ maskedEmail: result.maskedEmail });
        }

        if (
            method === HTTP_METHOD.POST &&
            pathEndsWith(path, '/newsletter/unsubscribe/request-link')
        ) {
            await requestUnsubscribeLink(event);
            return success({ ok: true });
        }

        if (
            method === HTTP_METHOD.POST &&
            pathEndsWith(path, '/newsletter/unsubscribe')
        ) {
            const result = await unsubscribeNewsletter(event);
            if (result.ok === false) {
                if (result.reason === 'already_unsubscribed') {
                    return conflictBody({ error: result.reason });
                }
                return notFoundBody({ error: result.reason });
            }
            return success({ ok: true });
        }

        if (
            method === HTTP_METHOD.GET &&
            pathEndsWith(path, '/newsletter/preferences')
        ) {
            const result = await getNewsletterPreferences(event);
            if (result.ok === false) {
                return unauthorizedBody({ error: result.reason });
            }
            return success({
                preferences: result.preferences,
                frequency: result.frequency,
                email: result.email,
                categories: result.categories,
                companies: result.companies,
            });
        }

        if (
            method === HTTP_METHOD.PUT &&
            pathEndsWith(path, '/newsletter/preferences')
        ) {
            const result = await putNewsletterPreferences(event);
            if (result.ok === false) {
                if (result.reason === 'bad_request') {
                    return badRequest(result.message);
                }
                return unauthorizedBody({ error: result.reason });
            }
            return success({
                preferences: result.preferences,
                frequency: result.frequency,
            });
        }

        return methodNotAllowed();
    } catch (e) {
        const error = errorWithPrefix(e, 'newsletter api');
        logger.error(error);
        await logger.wait();
        return serverError();
    }
};
