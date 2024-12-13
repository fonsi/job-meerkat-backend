import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { Company } from 'company/domain/company';

export const marshall = (company: Company): Record<string, AttributeValue> => {
  const { id, name, homePage, logo } = company;

  const item = {
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

  if (logo.background) {
    item['logoBackground'] = {
      S: logo.background
    }
  }

  return item;
};
