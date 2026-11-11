// Not under test; also imports `category/*`, which jest's path mapper lacks.
jest.mock('newsletter/application/getNewsletterPreferences', () => ({
    getNewsletterPreferences: jest.fn(),
}));
jest.mock('newsletter/application/subscribeNewsletter', () => ({
    subscribeNewsletter: jest.fn(),
}));
jest.mock('shared/infrastructure/logger/logger', () => {
    const logger = {
        init: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        wait: jest.fn().mockResolvedValue(undefined),
        event: jest.fn(),
    };
    return { logger, initializeLogger: jest.fn() };
});

import { subscribeNewsletter } from 'newsletter/application/subscribeNewsletter';
import { index } from './handler';

const subscribeEvent = {
    body: JSON.stringify({ email: 'a@b.co', website: 'x' }),
    requestContext: {
        http: { method: 'POST', path: '/newsletter/subscribe' },
    },
};

describe('newsletter handler: subscribe', () => {
    it.each(['sent', 'honeypot', 'ip_rate_limited', 'email_cooldown'])(
        'returns the same 200 {ok:true} when the outcome is %s',
        async (outcome) => {
            jest.spyOn(console, 'log').mockImplementation(() => undefined);
            (subscribeNewsletter as jest.Mock).mockResolvedValue({
                ok: true,
                outcome,
            });

            const response = await index(subscribeEvent);

            expect(response.statusCode).toBe(200);
            expect(JSON.parse(response.body)).toEqual({ ok: true });
        },
    );
});
