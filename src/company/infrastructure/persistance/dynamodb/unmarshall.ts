import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { Company, CompanyId, makeCompanyLogoUrl } from 'company/domain/company';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';

export const unmarshall = (item: Record<string, AttributeValue>): Company => {
    try {
        const id = item['id']['S'] as CompanyId;
        const logoUrl = makeCompanyLogoUrl({ id });

        return {
            id: item['id']['S'] as CompanyId,
            name: item['name']['S'],
            homePage: item['homePage']['S'],
            logo: {
                url: logoUrl,
                background: item['logoBackground']?.['S'],
            },
            ...(item['description']?.['S']
                ? { description: item['description']['S'] }
                : {}),
            ...(item['status']?.['S']
                ? { status: item['status']['S'] as Company['status'] }
                : {}),
            ...(item['statusMessage']?.['S']
                ? { statusMessage: item['statusMessage']['S'] }
                : {}),
            ...(item['disabledAt']?.['N']
                ? { disabledAt: Number(item['disabledAt']['N']) }
                : {}),
        };
    } catch (e) {
        throw new UnmarshallError(e.message, 'Company', item);
    }
};
