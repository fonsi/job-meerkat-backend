jest.mock(
    'report/infrastructure/persistance/dynamodb/dynamodbReportRepository',
    () => ({
        reportRepository: {
            getByEmailNormalized: jest.fn(),
            createPending: jest.fn(),
            resetToPending: jest.fn(),
        },
    }),
);
jest.mock('newsletter/infrastructure/email/sendNewsletterEmails', () => ({
    sendConfirmLinkForReport: jest.fn(),
    sendPreferencesLinkForReport: jest.fn(),
}));
jest.mock('newsletter/infrastructure/url/buildNewsletterUrls', () => ({
    buildConfirmUrl: (token: string) => `https://example.com/c?t=${token}`,
    buildSettingsUrl: (token: string) => `https://example.com/s?t=${token}`,
}));
jest.mock('shared/infrastructure/rateLimit/dynamodbRateLimitStore', () => ({
    dynamodbRateLimitStore: {},
}));

import {
    sendConfirmLinkForReport,
    sendPreferencesLinkForReport,
} from 'newsletter/infrastructure/email/sendNewsletterEmails';
import { Report } from 'report/domain/report';
import { reportRepository } from 'report/infrastructure/persistance/dynamodb/dynamodbReportRepository';
import { createMemoryRateLimitStore } from 'shared/infrastructure/rateLimit/memoryRateLimitStore';
import { subscribeNewsletter } from './subscribeNewsletter';

const report = (overrides: Partial<Report> = {}): Report => ({
    id: 'report-1',
    email: 'user@example.com',
    emailNormalized: 'user@example.com',
    status: 'pending',
    frequency: 'daily',
    createdAt: Date.now(),
    unsubscribeToken: 'token',
    ...overrides,
});

const event = (body: unknown, sourceIp = '203.0.113.7') => ({
    body: JSON.stringify(body),
    requestContext: { http: { sourceIp } },
});

describe('subscribeNewsletter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            null,
        );
        (reportRepository.createPending as jest.Mock).mockImplementation(
            async (input) => report(input),
        );
    });

    it('creates a pending row and sends one confirm email', async () => {
        const result = await subscribeNewsletter(
            event({ email: ' User@Example.com ' }),
            { rateLimitStore: createMemoryRateLimitStore() },
        );

        expect(result).toEqual({ ok: true, outcome: 'sent' });
        expect(reportRepository.createPending).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'User@Example.com',
                emailNormalized: 'user@example.com',
            }),
        );
        expect(sendConfirmLinkForReport).toHaveBeenCalledTimes(1);
    });

    it('silently succeeds without storing or emailing when the honeypot is filled', async () => {
        const store = createMemoryRateLimitStore();
        const result = await subscribeNewsletter(
            event({ email: 'bot@example.com', website: 'http://spam' }),
            { rateLimitStore: store },
        );

        expect(result).toEqual({ ok: true, outcome: 'honeypot' });
        expect(reportRepository.getByEmailNormalized).not.toHaveBeenCalled();
        expect(reportRepository.createPending).not.toHaveBeenCalled();
        expect(sendConfirmLinkForReport).not.toHaveBeenCalled();
        expect(store.keys()).toHaveLength(0);
    });

    it('sends one email for a burst of 4 identical requests', async () => {
        const store = createMemoryRateLimitStore();
        const body = { email: 'burst@example.com' };

        const outcomes = await Promise.all(
            [0, 1, 2, 3].map(() =>
                subscribeNewsletter(event(body), { rateLimitStore: store }),
            ),
        );

        expect(outcomes.map((o) => o.outcome).sort()).toEqual([
            'email_cooldown',
            'email_cooldown',
            'email_cooldown',
            'sent',
        ]);
        expect(reportRepository.createPending).toHaveBeenCalledTimes(1);
        expect(sendConfirmLinkForReport).toHaveBeenCalledTimes(1);
    });

    it('does not re-send the settings link to an active subscriber in a burst', async () => {
        (reportRepository.getByEmailNormalized as jest.Mock).mockResolvedValue(
            report({ status: 'active' }),
        );
        const store = createMemoryRateLimitStore();

        await subscribeNewsletter(event({ email: 'user@example.com' }), {
            rateLimitStore: store,
        });
        await subscribeNewsletter(event({ email: 'user@example.com' }), {
            rateLimitStore: store,
        });

        expect(sendPreferencesLinkForReport).toHaveBeenCalledTimes(1);
    });

    it('ignores bodies without an email', async () => {
        const result = await subscribeNewsletter(
            { body: '{}' },
            { rateLimitStore: createMemoryRateLimitStore() },
        );

        expect(result).toEqual({ ok: true, outcome: 'invalid' });
        expect(reportRepository.getByEmailNormalized).not.toHaveBeenCalled();
    });

    it('still subscribes when the rate-limit store is down', async () => {
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
        const result = await subscribeNewsletter(
            event({ email: 'user@example.com' }),
            {
                rateLimitStore: {
                    hit: jest.fn().mockRejectedValue(new Error('boom')),
                    claim: jest.fn(),
                },
            },
        );

        expect(result).toEqual({ ok: true, outcome: 'sent' });
        expect(sendConfirmLinkForReport).toHaveBeenCalledTimes(1);
    });
});
