import { marshall } from './marshall';
import { unmarshall } from './unmarshall';
import {
    getItem,
    putItem,
    scan,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import {
    CompanyRepository,
    Create,
    GetAll,
    GetById,
} from 'company/domain/companyRepository';

const COMPANY_TABLE = process.env.DYNAMODB_COMPANY_TABLE_NAME;

const create: Create = async (company) => {
    try {
        const item = marshall(company);
        await putItem(COMPANY_TABLE, item);

        return company;
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getAll: GetAll = async () => {
    try {
        const results = await scan(COMPANY_TABLE, {});
        const items = results.Items;

        if (!items) {
            return [];
        }

        return items.map(unmarshall);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

const getById: GetById = async (companyId) => {
    try {
        const result = await getItem(COMPANY_TABLE, {
            id: {
                S: companyId,
            },
        });
        const item = result.Item;

        if (!item) {
            return null;
        }

        return unmarshall(item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const companyRepository = {
    create,
    getAll,
    getById,
} as CompanyRepository;
