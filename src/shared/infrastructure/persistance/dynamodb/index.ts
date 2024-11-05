import AWS from 'aws-sdk';
import {
  BatchGetItemInput,
  BatchGetItemOutput,
  BatchWriteItemInput,
  BatchWriteItemOutput,
  DeleteItemInput,
  DeleteItemOutput,
  GetItemInput,
  GetItemOutput,
  Key,
  KeysAndAttributes,
  PutItemInput,
  PutItemInputAttributeMap,
  PutItemOutput,
  QueryInput,
  QueryOutput,
  ScanInput,
  ScanOutput,
  UpdateItemInput,
  UpdateItemOutput,
} from 'aws-sdk/clients/dynamodb';

export type UpdateItemExpression = Omit<UpdateItemInput, 'TableName'>;

export const getItem = (table: string, key: Key): Promise<GetItemOutput> => {
  return new Promise((resolve, reject) => {
    const dynamodb = new AWS.DynamoDB();
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
    const dynamodb = new AWS.DynamoDB();
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

export const putItem = (table: string, item: PutItemInputAttributeMap): Promise<PutItemOutput> => {
  return new Promise((resolve, reject) => {
    const dynamodb = new AWS.DynamoDB();
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

export const updateItem = (table: string, update: UpdateItemExpression): Promise<UpdateItemOutput> => {
  return new Promise((resolve, reject) => {
    const dynamodb = new AWS.DynamoDB();
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

export const deleteItem = (table: string, key: Key): Promise<DeleteItemOutput> => {
  return new Promise((resolve, reject) => {
    const dynamodb = new AWS.DynamoDB();
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

export const batchWriteItems = (table: string, items: PutItemInputAttributeMap[]): Promise<BatchWriteItemOutput> =>
  new Promise((resolve, reject) => {
    const dynamodb = new AWS.DynamoDB();
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

export const query = (table: string, query: Omit<QueryInput, 'TableName'>): Promise<QueryOutput> => {
  return new Promise((resolve, reject) => {
    const dynamodb = new AWS.DynamoDB();
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

export const scan = (table: string, query: Omit<ScanInput, 'TableName'>): Promise<ScanOutput> => {
  return new Promise((resolve, reject) => {
    const dynamodb = new AWS.DynamoDB();
    const input: ScanInput = {
      TableName: table,
      ...query,
    };

    dynamodb.scan(input, (err, data) => {
      if (err) {
        reject(err);
      }

      resolve(data);
    });
  });
};
