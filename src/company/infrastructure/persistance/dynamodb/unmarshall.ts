import { AttributeMap } from 'aws-sdk/clients/dynamodb';
import { Company, CompanyId } from 'company/domain/company';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';

export const unmarshall = (item: AttributeMap): Company => {
  try {
    return {
      id: item['id']['S'] as CompanyId,
      name: item['name']['S'],
      homePage: item['homePage']['S'],
    };
  } catch (e) {
    throw new UnmarshallError(e.message, 'Company', item);
  }
};
