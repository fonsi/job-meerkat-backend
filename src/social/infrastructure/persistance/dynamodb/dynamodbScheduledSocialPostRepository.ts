import { marshall } from './marshall';
import { unmarshall } from './unmarshall';
import {
    putItem,
    scan,
    deleteItem,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import {
    GetAll,
    Add,
    Remove,
} from 'social/domain/scheduledSocialPostRepository';
import { ScheduledSocialPostRepository } from 'social/domain/scheduledSocialPostRepository';

const SCHEDULED_SOCIAL_POST_TABLE =
    process.env.DYNAMODB_SCHEDULED_SOCIAL_POST_TABLE_NAME;

const getAll: GetAll = async () => {
    try {
        const results = await scan(SCHEDULED_SOCIAL_POST_TABLE, {});
        const items = results.Items;

        if (!items) {
            return [];
        }

        return items.map(unmarshall);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const add: Add = async (scheduledSocialPost) => {
    try {
        const item = marshall(scheduledSocialPost);

        await putItem(SCHEDULED_SOCIAL_POST_TABLE, item);

        return;
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const remove: Remove = async (scheduledSocialPost) => {
    try {
        await deleteItem(SCHEDULED_SOCIAL_POST_TABLE, {
            id: {
                S: scheduledSocialPost.id,
            },
        });

        return;
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const scheduledSocialPostRepository = {
    getAll,
    add,
    remove,
} as ScheduledSocialPostRepository;
