import { Company, CompanyId } from 'company/domain/company';
import { JobPost } from 'jobPost/domain/jobPost';
import { CUSTOMERIO_NAME, customerioScrapper } from './customerio';
import { FLOAT_NAME, floatScrapper } from './float';
import { HUMAN_SIGNAL_NAME, humanSignalScrapper } from './humanSignal';
import { CHERRE_NAME, cherreScrapper } from './cherre';
import { ALL_TRAILS_NAME, allTrailsScrapper } from './allTrails';
import { PHANTOM_NAME, phantomScrapper } from './phantom';
import { PULUMI_NAME, pulumiScrapper } from './pulumi';
import { DISCORD_NAME, discordScrapper } from './discord';
import { PLANET_SCALE_NAME, planetScaleScrapper } from './planetScale';
import { STREAK_NAME, streakScrapper } from './streak';
import { MIMO_NAME, mimoScrapper } from './mimo';
import { FEELD_NAME, feeldScrapper } from './feeld';
import { SUPER_NAME, superScrapper } from './super';

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
    switch (companyName?.toLowerCase()) {
        case CUSTOMERIO_NAME:
            return customerioScrapper;
        case FLOAT_NAME:
            return floatScrapper;
        case HUMAN_SIGNAL_NAME:
            return humanSignalScrapper;
        case CHERRE_NAME:
            return cherreScrapper;
        case ALL_TRAILS_NAME:
            return allTrailsScrapper;
        case PHANTOM_NAME:
            return phantomScrapper;
        case PULUMI_NAME:
            return pulumiScrapper;
        case DISCORD_NAME:
            return discordScrapper;
        case PLANET_SCALE_NAME:
            return planetScaleScrapper;
        case STREAK_NAME:
            return streakScrapper;
        case MIMO_NAME:
            return mimoScrapper;
        case FEELD_NAME:
            return feeldScrapper;
        case SUPER_NAME:
            return superScrapper;
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