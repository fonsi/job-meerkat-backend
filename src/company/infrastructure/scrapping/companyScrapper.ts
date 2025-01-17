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
import { REVENUE_CAT_NAME, revenueCatScrapper } from './revenueCat';
import { KIT_NAME, kitScrapper } from './kit';
import { DUCK_DUCK_GO_NAME, duckDuckGoScrapper } from './duckDuckGo';
import { REC_ROOM_NAME, recRoomScrapper } from './recroom';
import { CHORUS_ONE_NAME, chorusOneScrapper } from './chorusOne';
import { ZERO_X_NAME, zeroXScrapper } from './0x';
import { TINYBIRD_NAME, tinybirdScrapper } from './tinybird';
import { HAPPY_MONEY_NAME, happyMoneyScrapper } from './happyMoney';
import { ASTRONOMER_NAME, astronomerScrapper } from './astronomer';
import { CIRCLE_NAME, circleScrapper } from './circle';
import { INVISIBLE_NAME, invisibleScrapper } from './invisible';
import { PHOTOROOM_NAME, photoroomScrapper } from './photoroom';
import { HELPSCOUT_NAME, helpscoutScrapper } from './helpscout';
import { CODE_SIGNAL_NAME, codeSignalScrapper } from './codeSignal';
import { MATTERMOST_NAME, mattermostScrapper } from './mattermost';
import { HIGHTOUCH_NAME, hightouchScrapper } from './hightouch';

type CompanyScrapperData = {
    companyId: CompanyId;
};

type BuildCompanyScrapperData = {
    company: Company;
};

export type ScrappedJobPost = Omit<JobPost, 'id' | 'createdAt' | 'closedAt'> & {
    createdAt?: number | null;
};
export type CompanyScrapper = () => Promise<ScrappedJobPost[]>;
export type CompanyScrapperFn = (
    data: CompanyScrapperData,
) => Promise<ScrappedJobPost[]>;

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
        case REVENUE_CAT_NAME:
            return revenueCatScrapper;
        case KIT_NAME:
            return kitScrapper;
        case DUCK_DUCK_GO_NAME:
            return duckDuckGoScrapper;
        case REC_ROOM_NAME:
            return recRoomScrapper;
        case CHORUS_ONE_NAME:
            return chorusOneScrapper;
        case ZERO_X_NAME:
            return zeroXScrapper;
        case TINYBIRD_NAME:
            return tinybirdScrapper;
        case HAPPY_MONEY_NAME:
            return happyMoneyScrapper;
        case ASTRONOMER_NAME:
            return astronomerScrapper;
        case CIRCLE_NAME:
            return circleScrapper;
        case INVISIBLE_NAME:
            return invisibleScrapper;
        case PHOTOROOM_NAME:
            return photoroomScrapper;
        case HELPSCOUT_NAME:
            return helpscoutScrapper;
        case CODE_SIGNAL_NAME:
            return codeSignalScrapper;
        case MATTERMOST_NAME:
            return mattermostScrapper;
        case HIGHTOUCH_NAME:
            return hightouchScrapper;
    }

    return null;
};

export const buildCompanyScrapper = ({
    company,
}: BuildCompanyScrapperData): CompanyScrapper => {
    const scrapperFn = getCompanyScrapperFn(company.name);

    if (!scrapperFn) {
        console.log(company);
        throw new Error('Company not found');
    }

    return () => scrapperFn({ companyId: company.id });
};
