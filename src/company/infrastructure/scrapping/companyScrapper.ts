import { Company, CompanyId } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import { CUSTOMERIO_NAME, customerioScrapper } from './customerio/customerioScrapper';
import { FLOAT_NAME, floatScrapper } from './float/floatScrapper';

type CompanyScrapperData = {
    companyId: CompanyId;
}

type BuildCompanyScrapperData = {
    company: Company;
}

export type ScrappedJobPost = Omit<JobPost, 'id' | 'createdAt' | 'closedAt'> & {
    createdAt?: number | null;
};
export type CompanyScrapper = () => Promise<ScrappedJobPost[]>;
export type CompanyScrapperFn = (data: CompanyScrapperData) => Promise<ScrappedJobPost[]>;

const getCompanyScrapperFn = (companyName: string): CompanyScrapperFn => {
    switch (companyName) {
        case CUSTOMERIO_NAME:
            return customerioScrapper;
        case FLOAT_NAME:
            return floatScrapper;
    }

    return null;
}

export const buildCompanyScrapper = ({ company }: BuildCompanyScrapperData): CompanyScrapper => {
    const scrapperFn = getCompanyScrapperFn(company.name);

    if (!scrapperFn) {
        console.log(company);
        throw new Error('Company not found');
    }

    return () => scrapperFn({ companyId: company.id });
}