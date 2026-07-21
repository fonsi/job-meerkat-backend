import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { Company } from 'company/domain/company';

export const marshall = (company: Company): Record<string, AttributeValue> => {
    const { id, name, homePage, logo, description } = company;

    const item: Record<string, AttributeValue> = {
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
            S: logo.background,
        };
    }

    if (description) {
        item['description'] = {
            S: description,
        };
    }

    return item;
};
