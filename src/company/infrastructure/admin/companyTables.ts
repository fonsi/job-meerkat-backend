import { Company, CompanyId } from 'company/domain/company';
import {
    getItem,
    putItem,
    scan,
} from 'shared/infrastructure/persistance/dynamodb';
import { DynamodbError } from 'shared/infrastructure/persistance/dynamodb/error/dynamodbError';
import { marshall } from '../persistance/dynamodb/marshall';
import { unmarshall } from '../persistance/dynamodb/unmarshall';

export const getAllFromTable = async (table: string): Promise<Company[]> => {
    try {
        const results = await scan(table, {});
        const items = results.Items;
        if (!items) return [];

        return items.map(unmarshall);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const getByIdFromTable = async (
    table: string,
    companyId: CompanyId,
): Promise<Company | null> => {
    try {
        const result = await getItem(table, {
            id: { S: companyId },
        });
        if (!result.Item) return null;

        return unmarshall(result.Item);
    } catch (e) {
        throw new DynamodbError(e);
    }
};

export const putCompanyInTable = async (
    table: string,
    company: Company,
): Promise<void> => {
    try {
        await putItem(table, marshall(company));
    } catch (e) {
        throw new DynamodbError(e);
    }
};
