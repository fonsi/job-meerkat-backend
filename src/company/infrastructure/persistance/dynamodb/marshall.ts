import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { Company } from 'company/domain/company';

export const marshall = (company: Company): Record<string, AttributeValue> => {
  const { id, name, homePage } = company;

  return {
    id: {
      S: id,
    },
    name: {
      S: name,
    },
    homePage: {
      S: homePage,
    },
  };
};
