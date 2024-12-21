import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { PersistanceError } from '../../error/persistanceError';

const printItem = (item: unknown) => {
    try {
        return JSON.stringify(item);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
        return item;
    }
};

export class UnmarshallError extends PersistanceError {
    constructor(
        message: string,
        entity: string,
        item: Record<string, AttributeValue>,
    ) {
        super(
            `[UNMARSHALL] [${entity}] \n Record: ${printItem(item)} \n Error: ${message}`,
        );
    }
}
