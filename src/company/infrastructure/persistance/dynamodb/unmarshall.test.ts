import { Company, CompanyId } from 'company/domain/company';
import { UnmarshallError } from 'shared/infrastructure/persistance/dynamodb/error/unmarshallError';
import { unmarshall } from './unmarshall';

jest.mock('shared/infrastructure/assets/constants', () => {
    return {
        ASSETS_BASE_URL: 'https//test-assets.com',
    };
});

const companyId: CompanyId = '12345-31231-4123-13123-231312231231';
const companyName = 'Company name';
const homePage = 'https://home.page';
const logoUrl = `https//test-assets.com/company/${companyId}/logo.png`;
const baseItem = {
    id: {
        S: companyId,
    },
    name: {
        S: companyName,
    },
    homePage: {
        S: homePage,
    },
};

describe('DynamoDB company unmarshall', () => {
    it('should return a Company from an Item', () => {
        const company: Company = {
            id: companyId,
            name: companyName,
            homePage: homePage,
            logo: {
                url: logoUrl,
            },
        };

        expect(unmarshall(baseItem)).toEqual(company);
    });

    it('should return a Company with logo background', () => {
        const logoBg = '#fff';
        const item = {
            ...baseItem,
            logoBackground: {
                S: logoBg,
            },
        };
        const company: Company = {
            id: companyId,
            name: companyName,
            homePage,
            logo: {
                url: logoUrl,
                background: logoBg,
            },
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
