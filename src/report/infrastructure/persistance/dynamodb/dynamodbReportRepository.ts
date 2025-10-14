import { scan } from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import { GetAll, ReportRepository } from 'report/domain/reportRepository';
import { unmarshall } from './unmarshall';

const REPORT_TABLE = process.env.DYNAMODB_REPORT_TABLE_NAME;

const getAll: GetAll = async () => {
    try {
        const results = await scan(REPORT_TABLE, {});
        const items = results.Items;

        if (!items) {
            return [];
        }

        return items.map(unmarshall);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const reportRepository = {
    getAll,
} as ReportRepository;
