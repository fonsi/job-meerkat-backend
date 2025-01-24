import { marshall } from './marshall';
import { unmarshall } from './unmarshall';
import {
    getItem,
    putItem,
    query,
    scan,
    updateItem,
    UpdateItemExpression,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import {
    JobPostRepository,
    Create,
    GetById,
    GetAllOpenByCompanyId,
    GetAll,
    GetAllByCompanyId,
    GetByOriginalIdAndCompanyId,
    Close,
    GetAllOpen,
} from 'jobPost/domain/jobPostRepository';
import { isOpen } from 'jobPost/domain/jobPost';

const JOB_POST_TABLE = process.env.DYNAMODB_JOB_POST_TABLE_NAME;

const create: Create = async (jobPost) => {
    try {
        const item = marshall(jobPost);

        await putItem(JOB_POST_TABLE, item);

        return jobPost;
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getById: GetById = async (jobPostId) => {
    try {
        const result = await getItem(JOB_POST_TABLE, {
            id: {
                N: jobPostId.toString(),
            },
        });
        const item = result.Item;

        if (!item) {
            return null;
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getAll: GetAll = async () => {
    try {
        const results = await scan(JOB_POST_TABLE, {});
        const items = results.Items;

        if (!items) {
            return [];
        }

        return items.map(unmarshall);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getAllOpen: GetAllOpen = async () => {
    try {
        const allItems = await getAll();

        return allItems.filter(isOpen);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getAllByCompanyId: GetAllByCompanyId = async (companyId) => {
    try {
        const results = await scan(JOB_POST_TABLE, {
            FilterExpression: 'companyId = :companyId',
            ExpressionAttributeValues: {
                ':companyId': {
                    S: companyId,
                },
            },
        });
        const items = results.Items;

        if (!items) {
            return [];
        }

        return items.map(unmarshall);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getAllOpenByCompanyId: GetAllOpenByCompanyId = async (companyId) => {
    try {
        const allItems = await getAllByCompanyId(companyId);

        return allItems.filter(isOpen);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getByOriginalIdAndCompanyId: GetByOriginalIdAndCompanyId = async (
    originalId,
    companyId,
) => {
    try {
        const results = await query(JOB_POST_TABLE, {
            KeyConditionExpression: 'id = :id AND companyId = :companyId',
            ExpressionAttributeValues: {
                ':id': {
                    S: originalId,
                },
                ':companyId': {
                    S: companyId,
                },
            },
        });
        const item = results.Items[0];

        if (!item) {
            return null;
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const close: Close = async (jobPostId, companyId, closedAt) => {
    const update: UpdateItemExpression = {
        Key: {
            id: {
                S: jobPostId,
            },
            companyId: {
                S: companyId,
            },
        },
        UpdateExpression: 'SET closedAt = :closedAt',
        ExpressionAttributeValues: {
            ':closedAt': {
                N: closedAt.toString(),
            },
        },
    };

    const result = await updateItem(JOB_POST_TABLE, update);
    const item = result.Attributes;

    if (!item) {
        return null;
    }

    return unmarshall(item);
};

export const jobPostRepository = {
    create,
    getAll,
    getAllOpen,
    getAllByCompanyId,
    getAllOpenByCompanyId,
    getById,
    getByOriginalIdAndCompanyId,
    close,
} as JobPostRepository;
