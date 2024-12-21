import { Company, CompanyId } from './company';

export type Create = (company: Company) => Promise<Company>;
export type GetAll = () => Promise<Company[]>;
export type GetById = (companyId: CompanyId) => Promise<Company>;

export interface CompanyRepository {
    create: Create;
    getAll: GetAll;
    getById: GetById;
}
