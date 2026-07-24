import { marshall } from './marshall';
import { unmarshall } from './unmarshall';
import { TransactWriteItem } from '@aws-sdk/client-dynamodb';
import {
    putItem,
    query,
    scan,
    transactWriteItems,
    updateItem,
    UpdateItemExpression,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import {
    JobPostRepository,
    Create,
    GetAllOpenByCompanyId,
    GetAll,
    GetAllByCompanyId,
    GetByIdAndCompanyId,
    Close,
    Update,
    GetAllOpen,
    GetLatest,
    GetLatestSince,
    FROM_WHEN,
    GetBySlug,
    GetAllClosedBefore,
    MoveClosedToArchive,
} from 'jobPost/domain/jobPostRepository';
import { isOpen } from 'jobPost/domain/jobPost';

const JOB_POST_TABLE = process.env.DYNAMODB_JOB_POST_TABLE_NAME;
const CLOSED_JOB_POST_TABLE = process.env.DYNAMODB_CLOSED_JOB_POST_TABLE_NAME;

const create: Create = async (jobPost) => {
    try {
        const item = marshall(jobPost);

        await putItem(JOB_POST_TABLE, item);

        return jobPost;
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

const getByIdAndCompanyId: GetByIdAndCompanyId = async (id, companyId) => {
    try {
        const results = await query(JOB_POST_TABLE, {
            KeyConditionExpression: 'id = :id AND companyId = :companyId',
            ExpressionAttributeValues: {
                ':id': {
                    S: id,
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

const getLatestSince: GetLatestSince = async (sinceMs) => {
    try {
        const allOpenItems = await getAllOpen();
        const cutoff = Date.now() - sinceMs;
        return allOpenItems
            .filter((jobPost) => jobPost.createdAt > cutoff)
            .sort((a, b) => b.createdAt - a.createdAt);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getLatest: GetLatest = async () => getLatestSince(FROM_WHEN);

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

const update: Update = async (jobPost) => {
    try {
        const baseUpdateExpression =
            'SET originalId = :originalId, #type = :type, #title = :title, #url = :url, #category = :category, workplace = :workplace, #location = :location, createdAt = :createdAt';
        const salaryUpdateExpression = jobPost.salaryRange
            ? ', salaryCurrency = :salaryCurrency, salaryPeriod = :salaryPeriod, salaryMin = :salaryMin, salaryMax = :salaryMax'
            : '';
        const salaryRemoveExpression = jobPost.salaryRange
            ? ''
            : ', salaryCurrency, salaryPeriod, salaryMin, salaryMax';

        const updateExpression: UpdateItemExpression = {
            Key: {
                id: {
                    S: jobPost.id,
                },
                companyId: {
                    S: jobPost.companyId,
                },
            },
            UpdateExpression: `${baseUpdateExpression}${salaryUpdateExpression} REMOVE closedAt${salaryRemoveExpression}`,
            ExpressionAttributeNames: {
                '#type': 'type',
                '#title': 'title',
                '#url': 'url',
                '#category': 'category',
                '#location': 'location',
            },
            ExpressionAttributeValues: {
                ':originalId': {
                    S: jobPost.originalId,
                },
                ':type': {
                    S: jobPost.type,
                },
                ':title': {
                    S: jobPost.title,
                },
                ':url': {
                    S: jobPost.url,
                },
                ':category': {
                    S: jobPost.category,
                },
                ':workplace': {
                    S: jobPost.workplace,
                },
                ':location': {
                    S: jobPost.location,
                },
                ':createdAt': {
                    N: jobPost.createdAt.toString(),
                },
                ...(jobPost.salaryRange
                    ? {
                          ':salaryCurrency': {
                              S: jobPost.salaryRange.currency,
                          },
                          ':salaryPeriod': {
                              S: jobPost.salaryRange.period,
                          },
                          ':salaryMin': {
                              N: jobPost.salaryRange.min?.toString() || '0',
                          },
                          ':salaryMax': {
                              N: jobPost.salaryRange.max?.toString() || '0',
                          },
                      }
                    : {}),
            },
            ReturnValues: 'ALL_NEW',
        };

        const result = await updateItem(JOB_POST_TABLE, updateExpression);
        const item = result.Attributes;

        if (!item) {
            return null;
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getBySlug: GetBySlug = async (slug) => {
    try {
        const results = await query(JOB_POST_TABLE, {
            IndexName: 'slug-index',
            KeyConditionExpression: 'slug = :slug',
            ExpressionAttributeValues: {
                ':slug': {
                    S: slug,
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

const getAllClosedBefore: GetAllClosedBefore = async (closedBefore) => {
    try {
        const results = await scan(JOB_POST_TABLE, {
            FilterExpression:
                'attribute_exists(closedAt) AND closedAt <= :closedBefore',
            ExpressionAttributeValues: {
                ':closedBefore': {
                    N: closedBefore.toString(),
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

const moveClosedToArchive: MoveClosedToArchive = async (
    jobPost,
    closedBefore,
) => {
    const marshalledJobPost = marshall(jobPost);
    const transactionItems: TransactWriteItem[] = [
        {
            Put: {
                TableName: CLOSED_JOB_POST_TABLE,
                Item: marshalledJobPost,
                ConditionExpression:
                    'attribute_not_exists(id) AND attribute_not_exists(companyId)',
            },
        },
        {
            Delete: {
                TableName: JOB_POST_TABLE,
                Key: {
                    id: {
                        S: jobPost.id,
                    },
                    companyId: {
                        S: jobPost.companyId,
                    },
                },
                ConditionExpression:
                    'attribute_exists(closedAt) AND closedAt <= :closedBefore',
                ExpressionAttributeValues: {
                    ':closedBefore': {
                        N: closedBefore.toString(),
                    },
                },
            },
        },
    ];

    try {
        await transactWriteItems(transactionItems);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const jobPostRepository = {
    create,
    getAll,
    getAllOpen,
    getAllByCompanyId,
    getAllOpenByCompanyId,
    getByIdAndCompanyId,
    getBySlug,
    getLatest,
    getLatestSince,
    close,
    update,
    getAllClosedBefore,
    moveClosedToArchive,
} as JobPostRepository;
