import 'source-map-support/register';
import { getNewsletterPreferences } from 'newsletter/application/getNewsletterPreferences';
import { putNewsletterPreferences } from 'newsletter/application/putNewsletterPreferences';
import { requestNewsletterLink } from 'newsletter/application/requestNewsletterLink';
import { HTTP_METHOD } from 'shared/infrastructure/api/constants';
import {
    badRequest,
    methodNotAllowed,
    serverError,
    success,
    unauthorized,
} from 'shared/infrastructure/api/response';

const isRequestLinkPath = (path: string) =>
    path.endsWith('/newsletter/request-link') ||
    path.includes('/newsletter/request-link');

const isPreferencesPath = (path: string) =>
    path.endsWith('/newsletter/preferences') ||
    path.includes('/newsletter/preferences');

export const index = async (event) => {
    try {
        const method = event?.requestContext?.http?.method as
            | string
            | undefined;
        const path = event?.requestContext?.http?.path ?? '';

        if (method === HTTP_METHOD.POST && isRequestLinkPath(path)) {
            await requestNewsletterLink(event);
            return success({ ok: true });
        }

        if (method === HTTP_METHOD.GET && isPreferencesPath(path)) {
            const result = await getNewsletterPreferences(event);
            if (!result.ok) {
                return unauthorized();
            }
            return success({
                preferences: result.preferences,
                categories: result.categories,
                companies: result.companies,
            });
        }

        if (method === HTTP_METHOD.PUT && isPreferencesPath(path)) {
            const result = await putNewsletterPreferences(event);
            if (result.ok === false) {
                if (result.reason === 'bad_request') {
                    return badRequest(result.message);
                }
                return unauthorized();
            }
            return success({ preferences: result.preferences });
        }

        return methodNotAllowed();
    } catch (e) {
        console.log(`[Error]: ${e instanceof Error ? e.message : e}`);
        return serverError();
    }
};
