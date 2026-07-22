import { randomUUID, UUID } from 'crypto';
import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';

export type CompanyId = UUID;

export type CompanyLogo = {
    url: string;
    background?: string;
};

export type CompanyStatus = 'active' | 'disabled';

export type Company = {
    id: CompanyId;
    name: string;
    homePage: string;
    logo: CompanyLogo;
    /** Short blurb for company pages / SEO. */
    description?: string;
    /** Missing status means active (backwards compatible). */
    status?: CompanyStatus;
    statusMessage?: string;
    disabledAt?: number;
};

export const isCompanyDisabled = (company: Company): boolean =>
    company.status === 'disabled';

type CreateCompanyData = Omit<Company, 'id' | 'logo'> & {
    logo?: CompanyLogo;
};

export const makeCompanyLogoUrl = ({ id }: { id: CompanyId }) =>
    `${ASSETS_BASE_URL}/company/${id}/logo.png`;

export const createCompany = ({
    name,
    homePage,
    description,
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
        ...(description ? { description } : {}),
    };
};
