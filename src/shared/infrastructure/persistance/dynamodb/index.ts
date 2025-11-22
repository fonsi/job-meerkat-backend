import {
    AttributeValue,
    BatchGetItemInput,
    BatchGetItemOutput,
    BatchWriteItemInput,
    BatchWriteItemOutput,
    DeleteItemInput,
    DeleteItemOutput,
    DynamoDB,
    GetItemInput,
    GetItemOutput,
    KeysAndAttributes,
    PutItemInput,
    PutItemOutput,
    QueryInput,
    QueryOutput,
    ScanInput,
    ScanOutput,
    UpdateItemInput,
    UpdateItemOutput,
} from '@aws-sdk/client-dynamodb';

export type UpdateItemExpression = Omit<UpdateItemInput, 'TableName'>;

export const getItem = (
    table: string,
    key: Record<string, AttributeValue>,
): Promise<GetItemOutput> => {
    return new Promise((resolve, reject) => {
        const dynamodb = new DynamoDB();
        const input: GetItemInput = {
            TableName: table,
            Key: key,
        };

        dynamodb.getItem(input, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
};

export const batchGetItems = (
    batchInput: Array<{ table: string; keysAndAttributes: KeysAndAttributes }>,
): Promise<BatchGetItemOutput> => {
    return new Promise((resolve, reject) => {
        const dynamodb = new DynamoDB();
        const input: BatchGetItemInput = {
            RequestItems: batchInput.reduce((acc, input) => {
                return {
                    ...acc,
                    [input.table]: input.keysAndAttributes,
                };
            }, {}),
        };

        dynamodb.batchGetItem(input, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
};

export const putItem = (
    table: string,
    item: Record<string, AttributeValue>,
): Promise<PutItemOutput> => {
    return new Promise((resolve, reject) => {
        const dynamodb = new DynamoDB();
        const input: PutItemInput = {
            TableName: table,
            Item: item,
        };

        dynamodb.putItem(input, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
};

export const updateItem = (
    table: string,
    update: UpdateItemExpression,
): Promise<UpdateItemOutput> => {
    return new Promise((resolve, reject) => {
        const dynamodb = new DynamoDB();
        const input: UpdateItemInput = {
            TableName: table,
            ...update,
        };

        dynamodb.updateItem(input, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
};

export const deleteItem = (
    table: string,
    key: Record<string, AttributeValue>,
): Promise<DeleteItemOutput> => {
    return new Promise((resolve, reject) => {
        const dynamodb = new DynamoDB();
        const input: DeleteItemInput = {
            TableName: table,
            Key: key,
        };

        dynamodb.deleteItem(input, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
};

export const batchWriteItems = (
    table: string,
    items: Record<string, AttributeValue>[],
): Promise<BatchWriteItemOutput> =>
    new Promise((resolve, reject) => {
        const dynamodb = new DynamoDB();
        const input: BatchWriteItemInput = {
            RequestItems: {
                [table]: items.map((item) => ({
                    PutRequest: {
                        Item: item,
                    },
                })),
            },
        };

        dynamodb.batchWriteItem(input, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });

export const query = (
    table: string,
    query: Omit<QueryInput, 'TableName'>,
): Promise<QueryOutput> => {
    return new Promise((resolve, reject) => {
        const dynamodb = new DynamoDB();
        const input: QueryInput = {
            TableName: table,
            ...query,
        };

        dynamodb.query(input, (err, data) => {
            if (err) {
                reject(err);
            }

            resolve(data);
        });
    });
};

export const scan = async (
    table: string,
    query: Omit<ScanInput, 'TableName'>,
): Promise<ScanOutput> => {
    const dynamodb = new DynamoDB();
    const allItems: Record<string, AttributeValue>[] = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined =
        undefined;

    do {
        const input: ScanInput = {
            TableName: table,
            ...query,
            ExclusiveStartKey: lastEvaluatedKey,
        };

        const data = await new Promise<ScanOutput>((resolve, reject) => {
            dynamodb.scan(input, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(data);
            });
        });

        if (data.Items) {
            allItems.push(...data.Items);
        }

        lastEvaluatedKey = data.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return {
        Items: allItems,
        Count: allItems.length,
        ScannedCount: allItems.length,
    };
};
