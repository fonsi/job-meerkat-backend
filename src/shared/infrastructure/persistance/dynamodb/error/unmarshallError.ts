import { PersistanceError } from '../../error/persistanceError';
import { AttributeMap } from 'aws-sdk/clients/dynamodb';

const printItem = (item: unknown) => {
  try {
    return JSON.stringify(item);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    return item;
  }
};

export class UnmarshallError extends PersistanceError {
  constructor(message: string, entity: string, item: AttributeMap) {
    super(`[UNMARSHALL] [${entity}] \n Record: ${printItem(item)} \n Error: ${message}`);
  }
}
