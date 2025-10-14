import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import { Report, ReportId, ReportType } from 'report/domain/report';

export const unmarshall = (item: Record<string, AttributeValue>): Report => {
    try {
        return {
            id: item['id']['S'] as ReportId,
            type: item['type']['S'] as ReportType,
            email: item['email']['S'],
            createdAt: parseInt(item['createdAt']['N']),
        };
    } catch (e) {
        throw new UnmarshallError(e.message, 'Report', item);
    }
};
