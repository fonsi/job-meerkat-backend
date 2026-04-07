import {
    getItem,
    scan,
    updateItem,
    UpdateItemExpression,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import { normalizeEmail } from 'shared/infrastructure/email/normalizeEmail';
import {
    GetAll,
    GetByEmailNormalized,
    GetById,
    ReportRepository,
    UpdatePreferences,
} from 'report/domain/reportRepository';
import { ReportId } from 'report/domain/report';
import { unmarshall } from './unmarshall';

const REPORT_TABLE = process.env.DYNAMODB_REPORT_TABLE_NAME;

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

const getByEmailNormalized: GetByEmailNormalized = async (emailNormalized) => {
    try {
        const all = await getAll();
        return (
            all.find((r) => normalizeEmail(r.email) === emailNormalized) ?? null
        );
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const updatePreferences: UpdatePreferences = async (id, preferences) => {
    try {
        const update: UpdateItemExpression = {
            Key: {
                id: { S: id },
            },
            UpdateExpression: 'SET #p = :prefs',
            ExpressionAttributeNames: {
                '#p': 'preferences',
            },
            ExpressionAttributeValues: {
                ':prefs': {
                    S: JSON.stringify(preferences),
                },
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

export const reportRepository = {
    getAll,
    getById,
    getByEmailNormalized,
    updatePreferences,
} as ReportRepository;
