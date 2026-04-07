import {
    deleteItem,
    getItem,
    putItem,
    query,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import { MagicLinkRepository } from 'magicLink/domain/magicLinkRepository';
import { marshallStoredMagicLink } from './marshall';
import { unmarshallStoredMagicLink } from './unmarshall';

const TABLE = process.env.DYNAMODB_MAGIC_LINK_TABLE_NAME;
const SUBJECT_PURPOSE_GSI = 'subjectPurpose-index';

const put: MagicLinkRepository['put'] = async (link) => {
    try {
        await putItem(TABLE, marshallStoredMagicLink(link));
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const deleteBySubjectPurposeKey: MagicLinkRepository['deleteBySubjectPurposeKey'] =
    async (subjectPurposeKey) => {
        try {
            const results = await query(TABLE, {
                IndexName: SUBJECT_PURPOSE_GSI,
                KeyConditionExpression: 'subjectPurposeKey = :k',
                ExpressionAttributeValues: {
                    ':k': { S: subjectPurposeKey },
                },
            });

            const items = results.Items ?? [];
            await Promise.all(
                items.map((item) =>
                    deleteItem(TABLE, {
                        tokenHash: item['tokenHash'],
                    }),
                ),
            );
        } catch (e) {
            throw new DynamodbError(e);
        }
    };

const getByTokenHash: MagicLinkRepository['getByTokenHash'] = async (
    tokenHash,
) => {
    try {
        const result = await getItem(TABLE, {
            tokenHash: { S: tokenHash },
        });

        const item = result.Item;
        if (!item) {
            return null;
        }

        return unmarshallStoredMagicLink(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const dynamodbMagicLinkRepository: MagicLinkRepository = {
    put,
    deleteBySubjectPurposeKey,
    getByTokenHash,
};
