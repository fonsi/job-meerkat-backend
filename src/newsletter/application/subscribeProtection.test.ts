import { createMemoryRateLimitStore } from 'shared/infrastructure/rateLimit/memoryRateLimitStore';
import { RateLimitStore } from 'shared/infrastructure/rateLimit/rateLimitStore';
import {
    SUBSCRIBE_EMAIL_COOLDOWN_MS,
    SUBSCRIBE_IP_LIMIT,
    SUBSCRIBE_IP_WINDOW_MS,
    checkSubscribeBotSignals,
    checkSubscribeRateLimit,
} from './subscribeProtection';

const T0 = Date.UTC(2026, 9, 1, 10, 0, 0);

describe('checkSubscribeBotSignals', () => {
    it('blocks when the honeypot is filled', () => {
        expect(
            checkSubscribeBotSignals({
                email: 'a@b.co',
                honeypot: 'x',
                captchaToken: null,
            }),
        ).toEqual({ allowed: false, reason: 'honeypot' });
    });

    it('allows when the honeypot is empty', () => {
        expect(
            checkSubscribeBotSignals({
                email: 'a@b.co',
                honeypot: '',
                captchaToken: null,
            }),
        ).toEqual({ allowed: true });
    });
});

describe('checkSubscribeRateLimit', () => {
    it('absorbs a burst of the same email 4 times 5 s apart', async () => {
        const store = createMemoryRateLimitStore();
        const results = [];
        for (let i = 0; i < 4; i++) {
            results.push(
                await checkSubscribeRateLimit({
                    emailNormalized: 'bot@example.com',
                    sourceIp: '203.0.113.7',
                    store,
                    now: T0 + i * 5000,
                }),
            );
        }

        expect(results).toEqual([
            { allowed: true },
            { allowed: false, reason: 'email_cooldown' },
            { allowed: false, reason: 'email_cooldown' },
            { allowed: false, reason: 'email_cooldown' },
        ]);
    });

    it('lets the same email through again after the cooldown', async () => {
        const store = createMemoryRateLimitStore();
        const args = {
            emailNormalized: 'user@example.com',
            sourceIp: '198.51.100.1',
            store,
        };

        await checkSubscribeRateLimit({ ...args, now: T0 });
        expect(
            await checkSubscribeRateLimit({
                ...args,
                now: T0 + SUBSCRIBE_EMAIL_COOLDOWN_MS - 1,
            }),
        ).toEqual({ allowed: false, reason: 'email_cooldown' });
        expect(
            await checkSubscribeRateLimit({
                ...args,
                now: T0 + SUBSCRIBE_EMAIL_COOLDOWN_MS,
            }),
        ).toEqual({ allowed: true });
    });

    it('caps requests per IP per window, across different emails', async () => {
        const store = createMemoryRateLimitStore();
        const results = [];
        for (let i = 0; i < SUBSCRIBE_IP_LIMIT + 2; i++) {
            results.push(
                await checkSubscribeRateLimit({
                    emailNormalized: `user${i}@example.com`,
                    sourceIp: '203.0.113.7',
                    store,
                    now: T0 + i * 1000,
                }),
            );
        }

        expect(results.filter((r) => r.allowed)).toHaveLength(
            SUBSCRIBE_IP_LIMIT,
        );
        expect(results.slice(SUBSCRIBE_IP_LIMIT)).toEqual([
            { allowed: false, reason: 'ip_rate_limited' },
            { allowed: false, reason: 'ip_rate_limited' },
        ]);

        // Next window starts fresh.
        expect(
            await checkSubscribeRateLimit({
                emailNormalized: 'later@example.com',
                sourceIp: '203.0.113.7',
                store,
                now: T0 + SUBSCRIBE_IP_WINDOW_MS,
            }),
        ).toEqual({ allowed: true });
    });

    it('does not use up the email cooldown when the IP is over the limit', async () => {
        const store = createMemoryRateLimitStore();
        for (let i = 0; i < SUBSCRIBE_IP_LIMIT; i++) {
            await checkSubscribeRateLimit({
                emailNormalized: `user${i}@example.com`,
                sourceIp: '203.0.113.7',
                store,
                now: T0,
            });
        }
        await checkSubscribeRateLimit({
            emailNormalized: 'victim@example.com',
            sourceIp: '203.0.113.7',
            store,
            now: T0,
        });

        expect(
            await checkSubscribeRateLimit({
                emailNormalized: 'victim@example.com',
                sourceIp: '198.51.100.9',
                store,
                now: T0 + 1000,
            }),
        ).toEqual({ allowed: true });
    });

    it('skips the IP check when there is no source IP', async () => {
        const store = createMemoryRateLimitStore();
        const hit = jest.spyOn(store, 'hit');

        expect(
            await checkSubscribeRateLimit({
                emailNormalized: 'user@example.com',
                store,
                now: T0,
            }),
        ).toEqual({ allowed: true });
        expect(hit).not.toHaveBeenCalled();
    });

    it('never stores raw emails or IPs in keys', async () => {
        const store = createMemoryRateLimitStore();
        await checkSubscribeRateLimit({
            emailNormalized: 'user@example.com',
            sourceIp: '203.0.113.7',
            store,
            now: T0,
        });

        const keys = store.keys().join(' ');
        expect(keys).not.toContain('user@example.com');
        expect(keys).not.toContain('203.0.113.7');
    });

    it('fails open and reports when the store errors', async () => {
        const onStoreError = jest.fn();
        const store: RateLimitStore = {
            hit: jest.fn().mockRejectedValue(new Error('table missing')),
            claim: jest.fn(),
        };

        expect(
            await checkSubscribeRateLimit({
                emailNormalized: 'user@example.com',
                sourceIp: '203.0.113.7',
                store,
                now: T0,
                onStoreError,
            }),
        ).toEqual({ allowed: true });
        expect(onStoreError).toHaveBeenCalledWith(expect.any(Error));
    });
});
