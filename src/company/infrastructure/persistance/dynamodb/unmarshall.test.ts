import { Company } from 'company/domain/company';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import { unmarshall } from './unmarshall';

describe('DynamoDB company unmarshall', () => {
  it('should return a Company from an Item', () => {
    const item = {
      id: {
        S: '12345-31231-4123-13123-231312231231',
      },
      name: {
        S: 'Company name',
      },
      homePage: {
        S: 'https://home.page'
      }
    };
    const company: Company = {
      id: '12345-31231-4123-13123-231312231231',
      name: 'Company name',
      homePage: 'https://home.page',
    };

    expect(unmarshall(item)).toEqual(company);
  });

  it('should throw UnmarshallError if something goes wrong', () => {
    const item = {
      id: {
        S: 'fea19519-c97b-47e6-b916-5a475d6a41c1',
      },
    };

    expect(() => unmarshall(item)).toThrow(UnmarshallError);
  });
});
