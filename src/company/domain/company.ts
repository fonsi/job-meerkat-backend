import { randomUUID, UUID } from 'crypto';

export type CompanyId = UUID;

export type Company = {
    id: CompanyId;
    name: string;
    homePage: string;
}

type CreateCompanyData = Omit<Company, 'id'>;

export const createCompany = ({ name, homePage }: CreateCompanyData): Company => {
    const id = randomUUID();

    return {
        id,
        name,
        homePage,
    }
}