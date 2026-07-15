import {
    getItem,
    putItem,
    query,
    scan,
    updateItem,
    UpdateItemExpression,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import {
    Activate,
    CreatePending,
    GetAll,
    GetByEmailNormalized,
    GetById,
    GetByUnsubscribeToken,
    ReportRepository,
    Unsubscribe,
    ResetToPending,
    UpdateFrequency,
    UpdatePreferences,
    UpdateUnsubscribeToken,
} from 'report/domain/reportRepository';
import { ReportId } from 'report/domain/report';
import { randomUUID } from 'crypto';
import { marshallReport } from './marshall';
import { unmarshall } from './unmarshall';

const REPORT_TABLE = process.env.DYNAMODB_REPORT_TABLE_NAME;
const EMAIL_NORMALIZED_GSI = 'emailNormalized-index';
const UNSUBSCRIBE_TOKEN_GSI = 'unsubscribeToken-index';

const getAll: GetAll = async () => {
    try {
        const results = await scan(REPORT_TABLE, {});
        const items = results.Items;

        if (!items) {
            return [];
        }

        return items.map(unmarshall);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getById: GetById = async (id: ReportId) => {
    try {
        const result = await getItem(REPORT_TABLE, {
            id: { S: id },
        });

        if (!result.Item) {
            return null;
        }

        return unmarshall(result.Item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const queryOne = async (
    indexName: string,
    keyName: string,
    keyValue: string,
) => {
    const results = await query(REPORT_TABLE, {
        IndexName: indexName,
        KeyConditionExpression: `${keyName} = :k`,
        ExpressionAttributeValues: {
            ':k': { S: keyValue },
        },
        Limit: 1,
    });

    const item = results.Items?.[0];
    return item ? unmarshall(item) : null;
};

const getByEmailNormalized: GetByEmailNormalized = async (emailNormalized) => {
    try {
        const byGsi = await queryOne(
            EMAIL_NORMALIZED_GSI,
            'emailNormalized',
            emailNormalized,
        );
        if (byGsi) {
            return byGsi;
        }

        const all = await getAll();
        return (
            all.find((r) => normalizeEmail(r.email) === emailNormalized) ?? null
        );
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getByUnsubscribeToken: GetByUnsubscribeToken = async (token) => {
    try {
        const byGsi = await queryOne(
            UNSUBSCRIBE_TOKEN_GSI,
            'unsubscribeToken',
            token,
        );
        if (byGsi) {
            return byGsi;
        }

        const all = await getAll();
        return all.find((r) => r.unsubscribeToken === token) ?? null;
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const createPending: CreatePending = async ({
    email,
    emailNormalized,
    unsubscribeToken,
}) => {
    try {
        const now = Date.now();
        const report = {
            id: randomUUID(),
            email,
            emailNormalized,
            status: 'pending' as const,
            frequency: 'daily' as const,
            createdAt: now,
            unsubscribeToken,
        };

        await putItem(REPORT_TABLE, marshallReport(report));
        return report;
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const activate: Activate = async (id) => {
    try {
        const now = Date.now();
        const update: UpdateItemExpression = {
            Key: { id: { S: id } },
            UpdateExpression:
                'SET #status = :status, confirmedAt = :confirmedAt REMOVE unsubscribedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': { S: 'active' },
                ':confirmedAt': { N: now.toString() },
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await updateItem(REPORT_TABLE, update);
        const item = result.Attributes;

        if (!item) {
            throw new Error('activate: missing Attributes');
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const unsubscribe: Unsubscribe = async (id) => {
    try {
        const now = Date.now();
        const update: UpdateItemExpression = {
            Key: { id: { S: id } },
            UpdateExpression:
                'SET #status = :status, unsubscribedAt = :unsubscribedAt, unsubscribeToken = :token',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': { S: 'unsubscribed' },
                ':unsubscribedAt': { N: now.toString() },
                ':token': { S: randomUUID() },
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await updateItem(REPORT_TABLE, update);
        const item = result.Attributes;

        if (!item) {
            throw new Error('unsubscribe: missing Attributes');
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const resetToPending: ResetToPending = async (id, unsubscribeToken) => {
    try {
        const update: UpdateItemExpression = {
            Key: { id: { S: id } },
            UpdateExpression:
                'SET #status = :status, unsubscribeToken = :token REMOVE confirmedAt, unsubscribedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': { S: 'pending' },
                ':token': { S: unsubscribeToken },
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await updateItem(REPORT_TABLE, update);
        const item = result.Attributes;

        if (!item) {
            throw new Error('resetToPending: missing Attributes');
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const updateFrequency: UpdateFrequency = async (id, frequency) => {
    try {
        const update: UpdateItemExpression = {
            Key: { id: { S: id } },
            UpdateExpression: 'SET frequency = :frequency',
            ExpressionAttributeValues: {
                ':frequency': { S: frequency },
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await updateItem(REPORT_TABLE, update);
        const item = result.Attributes;

        if (!item) {
            throw new Error('updateFrequency: missing Attributes');
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const updatePreferences: UpdatePreferences = async (id, preferences) => {
    try {
        const update: UpdateItemExpression = {
            Key: { id: { S: id } },
            UpdateExpression: 'SET #p = :prefs',
            ExpressionAttributeNames: { '#p': 'preferences' },
            ExpressionAttributeValues: {
                ':prefs': { S: JSON.stringify(preferences) },
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await updateItem(REPORT_TABLE, update);
        const item = result.Attributes;

        if (!item) {
            throw new Error('updatePreferences: missing Attributes');
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const updateUnsubscribeToken: UpdateUnsubscribeToken = async (
    id,
    unsubscribeToken,
) => {
    try {
        const update: UpdateItemExpression = {
            Key: { id: { S: id } },
            UpdateExpression: 'SET unsubscribeToken = :token',
            ExpressionAttributeValues: {
                ':token': { S: unsubscribeToken },
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await updateItem(REPORT_TABLE, update);
        const item = result.Attributes;

        if (!item) {
            throw new Error('updateUnsubscribeToken: missing Attributes');
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const reportRepository = {
    getAll,
    getById,
    getByEmailNormalized,
    getByUnsubscribeToken,
    createPending,
    activate,
    unsubscribe,
    resetToPending,
    updateFrequency,
    updatePreferences,
    updateUnsubscribeToken,
} as ReportRepository;
