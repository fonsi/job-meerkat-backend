import { PersistanceError } from '../../error/persistanceError';

export class DynamodbError extends PersistanceError {
  constructor(e: Error) {
    super(`[DYNAMO_DB] ${e.message}`);
    this.stack = e.stack;
  }
}
