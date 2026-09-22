import { AttributeValue } from '@aws-sdk/client-dynamodb';
import {
    FollowerGrowthContent,
    isFollowerGrowthFamily,
} from 'social/domain/followerGrowthContent';
import {
    AddFollowerGrowthContent,
    FollowerGrowthContentRepository,
    GetAllFollowerGrowthContent,
} from 'social/domain/followerGrowthContentRepository';
import { putItem, scan } from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';

const FOLLOWER_GROWTH_CONTENT_TABLE =
    process.env.DYNAMODB_FOLLOWER_GROWTH_CONTENT_TABLE_NAME;

export const marshallFollowerGrowthContent = (
    content: FollowerGrowthContent,
): Record<string, AttributeValue> => ({
    id: { S: content.id },
    generatedAt: { N: content.generatedAt.toString() },
    family: { S: content.family },
    topicKey: { S: content.topicKey },
    summary: { S: content.summary },
});

export const unmarshallFollowerGrowthContent = (
    item: Record<string, AttributeValue>,
): FollowerGrowthContent => {
    try {
        const family = item['family']['S'];
        if (!isFollowerGrowthFamily(family)) {
            throw new Error(`Invalid follower growth family: ${family}`);
        }

        return {
            id: item['id']['S'] as FollowerGrowthContent['id'],
            generatedAt: parseInt(item['generatedAt']['N']),
            family,
            topicKey: item['topicKey']['S'],
            summary: item['summary']['S'],
        };
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Unknown unmarshall error';
        throw new UnmarshallError(message, 'FollowerGrowthContent', item);
    }
};

const getAll: GetAllFollowerGrowthContent = async () => {
    try {
        const results = await scan(FOLLOWER_GROWTH_CONTENT_TABLE, {});

        return (results.Items ?? []).map(unmarshallFollowerGrowthContent);
    } catch (error) {
        throw new DynamodbError(error);
    }
};

const add: AddFollowerGrowthContent = async (content) => {
    try {
        await putItem(
            FOLLOWER_GROWTH_CONTENT_TABLE,
            marshallFollowerGrowthContent(content),
        );
    } catch (error) {
        throw new DynamodbError(error);
    }
};

export const followerGrowthContentRepository = {
    getAll,
    add,
} as FollowerGrowthContentRepository;
