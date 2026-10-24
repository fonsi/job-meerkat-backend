import {
    putItem,
    updateItem,
} from 'shared/infrastructure/persistance/dynamodb';
import { RateLimitStore } from './rateLimitStore';

const TABLE = process.env.DYNAMODB_RATE_LIMIT_TABLE_NAME;

/** DynamoDB TTL wants epoch seconds; add a buffer so rows outlive their window. */
const TTL_BUFFER_MS = 60 * 1000;
const toTtlSeconds = (expiresAtMs: number): string =>
    Math.ceil((expiresAtMs + TTL_BUFFER_MS) / 1000).toString();

const isConditionalCheckFailed = (e: unknown): boolean =>
    (e as { name?: string })?.name === 'ConditionalCheckFailedException';

const hit: RateLimitStore['hit'] = async (key, windowMs, now) => {
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const result = await updateItem(TABLE, {
        Key: { pk: { S: `${key}#${windowStart}` } },
        UpdateExpression:
            'ADD hits :one SET expiresAt = if_not_exists(expiresAt, :ttl)',
        ExpressionAttributeValues: {
            ':one': { N: '1' },
            ':ttl': { N: toTtlSeconds(windowStart + windowMs) },
        },
        ReturnValues: 'UPDATED_NEW',
    });

    return parseInt(result.Attributes?.hits?.N ?? '1', 10);
};

const claim: RateLimitStore['claim'] = async (key, ttlMs, now) => {
    const expiresAtMs = now + ttlMs;
    try {
        await putItem(
            TABLE,
            {
                pk: { S: key },
                expiresAtMs: { N: expiresAtMs.toString() },
                expiresAt: { N: toTtlSeconds(expiresAtMs) },
            },
            {
                // TTL deletes lazily (can lag hours), so also accept rows
                // whose own expiry has passed.
                ConditionExpression:
                    'attribute_not_exists(pk) OR expiresAtMs <= :now',
                ExpressionAttributeValues: {
                    ':now': { N: now.toString() },
                },
            },
        );
        return true;
    } catch (e) {
        if (isConditionalCheckFailed(e)) {
            return false;
        }
        throw e;
    }
};

export const dynamodbRateLimitStore: RateLimitStore = { hit, claim };
