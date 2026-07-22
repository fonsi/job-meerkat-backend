import { Company, CompanyId } from 'company/domain/company';
import { marshall } from './marshall';

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

describe('DynamoDB company marshall', () => {
    it('should return an Item from a Company', () => {
        const company: Company = {
            id: companyId,
            name: companyName,
            homePage,
            logo: {
                url: logoUrl,
            },
        };

        expect(marshall(company)).toEqual(baseItem);
    });

    it('should return an Item with logo background', () => {
        const logoBg = '#fff';
        const company: Company = {
            id: companyId,
            name: companyName,
            homePage,
            logo: {
                url: logoUrl,
                background: logoBg,
            },
        };

        const item = {
            ...baseItem,
            logoBackground: {
                S: logoBg,
            },
        };

        expect(marshall(company)).toEqual(item);
    });

    it('should return an Item with description', () => {
        const description = 'Acme builds tools for remote teams.';
        const company: Company = {
            id: companyId,
            name: companyName,
            homePage,
            logo: {
                url: logoUrl,
            },
            description,
        };

        expect(marshall(company)).toEqual({
            ...baseItem,
            description: {
                S: description,
            },
        });
    });

    it('should return an Item with disabled status fields', () => {
        const statusMessage = 'Company shut down in June 2026.';
        const disabledAt = 1719700000000;
        const company: Company = {
            id: companyId,
            name: companyName,
            homePage,
            logo: {
                url: logoUrl,
            },
            status: 'disabled',
            statusMessage,
            disabledAt,
        };

        expect(marshall(company)).toEqual({
            ...baseItem,
            status: {
                S: 'disabled',
            },
            statusMessage: {
                S: statusMessage,
            },
            disabledAt: {
                N: disabledAt.toString(),
            },
        });
    });
});
