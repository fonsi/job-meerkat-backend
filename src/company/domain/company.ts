import { randomUUID, UUID } from 'crypto';
import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';

export type CompanyId = UUID;

export type CompanyLogo = {
    url: string;
    background?: string;
};

export type Company = {
    id: CompanyId;
    name: string;
    homePage: string;
    logo: CompanyLogo;
};

type CreateCompanyData = Omit<Company, 'id' | 'logo'> & {
    logo?: CompanyLogo;
};

export const makeCompanyLogoUrl = ({ id }: { id: CompanyId }) =>
    `${ASSETS_BASE_URL}/company/${id}/logo.png`;

export const createCompany = ({
    name,
    homePage,
}: CreateCompanyData): Company => {
    const id = randomUUID();
    const logo = {
        url: makeCompanyLogoUrl({ id }),
    };

    return {
        id,
        name,
        homePage,
        logo,
    };
};
