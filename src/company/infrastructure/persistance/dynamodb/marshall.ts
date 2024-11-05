import { PutItemInputAttributeMap } from 'aws-sdk/clients/dynamodb';
import { Company } from 'company/domain/company';

export const marshall = (company: Company): PutItemInputAttributeMap => {
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
