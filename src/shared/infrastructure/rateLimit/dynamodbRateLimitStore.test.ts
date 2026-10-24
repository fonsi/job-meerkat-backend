jest.mock('shared/infrastructure/persistance/dynamodb', () => ({
    putItem: jest.fn(),
    updateItem: jest.fn(),
}));

import {
    putItem,
    updateItem,
} from 'shared/infrastructure/persistance/dynamodb';
import { dynamodbRateLimitStore } from './dynamodbRateLimitStore';

const NOW = Date.UTC(2026, 9, 1, 10, 30, 0);
const HOUR = 60 * 60 * 1000;

describe('dynamodbRateLimitStore', () => {
    beforeEach(() => jest.clearAllMocks());

    it('hit: atomically increments a per-window counter with a TTL', async () => {
        (updateItem as jest.Mock).mockResolvedValue({
            Attributes: { hits: { N: '3' } },
        });

        const hits = await dynamodbRateLimitStore.hit('ip#abc', HOUR, NOW);

        expect(hits).toBe(3);
        const [, update] = (updateItem as jest.Mock).mock.calls[0];
        const windowStart = Date.UTC(2026, 9, 1, 10, 0, 0);
        expect(update.Key).toEqual({ pk: { S: `ip#abc#${windowStart}` } });
        expect(update.UpdateExpression).toContain('ADD hits :one');
        expect(
            parseInt(update.ExpressionAttributeValues[':ttl'].N, 10),
        ).toBeGreaterThanOrEqual((windowStart + HOUR) / 1000);
    });

    it('claim: conditional put returns true when free', async () => {
        (putItem as jest.Mock).mockResolvedValue({});

        await expect(
            dynamodbRateLimitStore.claim('email#abc', 5 * 60 * 1000, NOW),
        ).resolves.toBe(true);

        const [, item, options] = (putItem as jest.Mock).mock.calls[0];
        expect(item.pk).toEqual({ S: 'email#abc' });
        expect(item.expiresAtMs).toEqual({
            N: (NOW + 5 * 60 * 1000).toString(),
        });
        expect(options.ConditionExpression).toBe(
            'attribute_not_exists(pk) OR expiresAtMs <= :now',
        );
    });

    it('claim: returns false when the condition fails', async () => {
        const error = Object.assign(new Error('conditional'), {
            name: 'ConditionalCheckFailedException',
        });
        (putItem as jest.Mock).mockRejectedValue(error);

        await expect(
            dynamodbRateLimitStore.claim('email#abc', 1000, NOW),
        ).resolves.toBe(false);
    });

    it('claim: rethrows other errors', async () => {
        (putItem as jest.Mock).mockRejectedValue(new Error('throttled'));

        await expect(
            dynamodbRateLimitStore.claim('email#abc', 1000, NOW),
        ).rejects.toThrow('throttled');
    });
});
