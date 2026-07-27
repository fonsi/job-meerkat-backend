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
import { AIRBNB_NAME, airbnbScrapper } from './airbnb';
import { ASTRONOMER_NAME, astronomerScrapper } from './astronomer';
import { CIRCLE_NAME, circleScrapper } from './circle';
import { INVISIBLE_NAME, invisibleScrapper } from './invisible';
import { PHOTOROOM_NAME, photoroomScrapper } from './photoroom';
import { HELPSCOUT_NAME, helpscoutScrapper } from './helpscout';
import { CODE_SIGNAL_NAME, codeSignalScrapper } from './codeSignal';
import { MATTERMOST_NAME, mattermostScrapper } from './mattermost';
import { HIGHTOUCH_NAME, hightouchScrapper } from './hightouch';
import { HUMAN_INTEREST_NAME, humanInterestScrapper } from './humanInterest';
import { GUIDELINE_NAME, guidelineScrapper } from './guideline';
import { LATTICE_NAME, latticeScrapper } from './lattice';
import { FEDERATO_NAME, federatoScrapper } from './federato';
import { FULLSTORY_NAME, fullstoryScrapper } from './fullstory';
import { CINDER_NAME, cinderScrapper } from './cinder';
import { ZAPIER_NAME, zapierScrapper } from './zapier';
import { MAGIC_SCHOOL_NAME, magicSchoolScrapper } from './magicSchool';
import { RAMP_NAME, rampScrapper } from './ramp';
import { AMONDO_NAME, amondoScrapper } from './amondo';
import { CLOSE_NAME, closeScrapper } from './close';
import { MAILER_LITE_NAME, mailerLiteScrapper } from './mailerLite';
import { AXIOS_HQ_NAME, axiosHqScrapper } from './axioshq';
import { PROOF_NAME, proofScrapper } from './proof';
import { SUPERHUMAN_NAME, superhumanScrapper } from './superhuman';
import { ASSEMBLY_AI_NAME, assemblyAiScrapper } from './assemblyAI';
import { HEARD_NAME, heardScrapper } from './heard';
import { V7_NAME, v7Scrapper } from './v7';
import { krakenScrapper, KRAKEN_NAME } from './kraken';
import { RUNWAY_NAME, runwayScrapper } from './runway';
import { MAZE_NAME, mazeScrapper } from './maze';
import { MAZE_HQ_NAME, mazeHqScrapper } from './mazeHq';
import { RAVIO_NAME, ravioScrapper } from './ravio';
import { NETLIFY_NAME, netlifyScrapper } from './netlify';
import { CONFIANT_NAME, confiantScrapper } from './confiant';
import { LIGHTDASH_NAME, lightdashScrapper } from './lightdash';
import { POSTSCRIPT_NAME, postscriptScrapper } from './postscript';
import { SOURCEGRAPH_NAME, sourcegraphScrapper } from './sourcegraph';
import { DOCKER_NAME, dockerScrapper } from './docker';
import { DUOLINGO_NAME, duolingoScrapper } from './duolingo';
import { ONE_PASSWORD_NAME, onePasswordScrapper } from './1password';
import { LIMITLESS_NAME, limitlessScrapper } from './limitless';
import { REPLIT_NAME, replitScrapper } from './replit';
import { RETOOL_NAME, retoolScrapper } from './retool';
import { STRAVA_NAME, stravaScrapper } from './strava';
import { HORIZON_3_NAME, horizon3Scrapper } from './horizon3';
import { PROTONAI_NAME, protonaiScrapper } from './protonai';
import { BLUESKY_NAME, blueskyScrapper } from './bluesky';
import { BUBBLE_NAME, bubbleScrapper } from './bubble';
import { TWITCH_NAME, twitchScrapper } from './twitch';
import { AFFIRM_NAME, affirmScrapper } from './affirm';
import { ANTHROPIC_NAME, anthropicScrapper } from './anthropic';
import { ASHBY_NAME, ashbyScrapper } from './ashby';
import { ATTIO_NAME, attioScrapper } from './attio';
import { BUFFER_NAME, bufferScrapper } from './buffer';
import { BUILDER_NAME, builderScrapper } from './builder';
import { CAMUNDA_NAME, camundaScrapper } from './camunda';
import { CALENDLY_NAME, calendlyScrapper } from './calendly';
import { CHECKLY_NAME, checklyScrapper } from './checkly';
import { CHROMATIC_NAME, chromaticScrapper } from './chromatic';
import { CLICKUP_NAME, clickUpScrapper } from './clickUp';
import { CONSENSYS_NAME, consensysScrapper } from './consensys';
import { CYBERHAVEN_NAME, cyberhavenScrapper } from './cyberhaven';
import { DEEPGRAM_NAME, deepgramScrapper } from './deepgram';
import { DESCRIPT_NAME, descriptScrapper } from './descript';
import { DUALENTRY_NAME, dualentryScrapper } from './dualentry';
import { FIGMA_NAME, figmaScrapper } from './figma';
import { FINGERPRINT_NAME, fingerprintScrapper } from './fingerprint';
import { FREEWILL_NAME, freewillScrapper } from './freewill';
import { GEM_NAME, gemScrapper } from './gem';
import { GITLAB_NAME, gitlabScrapper } from './gitlab';
import { GRAFANA_LABS_NAME, grafanaLabsScrapper } from './grafanaLabs';
import { GUSTO_NAME, gustoScrapper } from './gusto';
import { HOP_SKIP_DRIVE_NAME, hopSkipDriveScrapper } from './hopSkipDrive';
import { INCIDENT_IO_NAME, incidentIoScrapper } from './incidentIo';
import { ISTARI_DIGITAL_NAME, istariDigitalScrapper } from './istariDigital';
import { KALEPA_NAME, kalepaScrapper } from './kalepa';
import { LAUNCHDARKLY_NAME, launchDarklyScrapper } from './launchDarkly';
import { MERCURY_NAME, mercuryScrapper } from './mercury';
import { MYSTEN_LABS_NAME, mystenLabsScrapper } from './mystenLabs';
import { PARAGON_NAME, paragonScrapper } from './paragon';
import { PREFECT_NAME, prefectScrapper } from './prefect';
import { REGRELLO_NAME, regrelloScrapper } from './regrello';
import { RENDER_NAME, renderScrapper } from './render';
import { RIVER_NAME, riverScrapper } from './river';
import { SANDBOX_AQ_NAME, sandboxAQScrapper } from './sandboxAQ';
import { SENTRY_NAME, sentryScrapper } from './sentry';
import { STRIPE_NAME, stripeScrapper } from './stripe';
import { SUPERMOVE_NAME, supermoveScrapper } from './supermove';
import { TAILSCALE_NAME, tailscaleScrapper } from './tailscale';
import { TINES_NAME, tinesScrapper } from './tines';
import { VERCEL_NAME, vercelScrapper } from './vercel';
import { WAVE_NAME, waveScrapper } from './wave';
import { WEBFLOW_NAME, webflowScrapper } from './webflow';
import { WISPR_FLOW_NAME, wisprFlowScrapper } from './wisprFlow';
import { WORKOS_NAME, workOsScrapper } from './workOs';
import {
    ABNORMAL_SECURITY_NAME,
    abnormalSecurityScrapper,
} from './abnormalSecurity';
import { BITWARDEN_NAME, bitwardenScrapper } from './bitwarden';
import { CRIBL_NAME, criblScrapper } from './cribl';
import { DOXIMITY_NAME, doximityScrapper } from './doximity';
import { EXPEL_NAME, expelScrapper } from './expel';
import { GLIDE_NAME, glideScrapper } from './glide';
import { GOLINKS_NAME, goLinksScrapper } from './goLinks';
import { HONEYCOMB_NAME, honeycombScrapper } from './honeycomb';
import { ITERABLE_NAME, iterableScrapper } from './iterable';
import { MARQETA_NAME, marqetaScrapper } from './marqeta';
import { MATERIALIZE_NAME, materializeScrapper } from './materialize';
import { OSO_NAME, osoScrapper } from './oso';
import { OUTSCHOOL_NAME, outschoolScrapper } from './outschool';
import { RESEND_NAME, resendScrapper } from './resend';
import { SPRIG_NAME, sprigScrapper } from './sprig';
import { STYTCH_NAME, stytchScrapper } from './stytch';
import { SUBSTACK_NAME, substackScrapper } from './substack';
import { TEMPORAL_NAME, temporalScrapper } from './temporal';
import { VULTR_NAME, vultrScrapper } from './vultr';
import { WIKIMEDIA_NAME, wikimediaScrapper } from './wikimedia';

type CompanyScrapperData = {
    companyId: CompanyId;
};

type BuildCompanyScrapperData = {
    company: Company;
};

export type ScrappedJobPost = Omit<
    JobPost,
    'id' | 'createdAt' | 'closedAt' | 'slug'
> & {
    createdAt?: number | null;
};
export type CompanyScrapper = () => Promise<ScrappedJobPost[]>;
export type CompanyScrapperFn = (
    data: CompanyScrapperData,
) => Promise<ScrappedJobPost[]>;

const getCompanyScrapperFn = (companyName: string): CompanyScrapperFn => {
    void companyName;
    return null;
};

export type ListedJobPostsData = {
    id: string;
    url: string;
    title: string;
    createdAt?: number;
    locationText?: string;
    content?: string;
    data?: Record<string, unknown>;
};

export type NewCompanyScrapper = ({ companyId }: { companyId: CompanyId }) => {
    getListedJobPostsData: () => Promise<ListedJobPostsData[]>;
    scrapJobPost: (
        jobPostData: ListedJobPostsData[],
    ) => Promise<ScrappedJobPost[]>;
};

export const getNewCompanyScrapper = (company: Company): NewCompanyScrapper => {
    switch (company.name?.toLowerCase()) {
        case AFFIRM_NAME:
            return affirmScrapper;
        case AIRBNB_NAME:
            return airbnbScrapper;
        case ALL_TRAILS_NAME:
            return allTrailsScrapper;
        case AMONDO_NAME:
            return amondoScrapper;
        case ANTHROPIC_NAME:
            return anthropicScrapper;
        case ASSEMBLY_AI_NAME:
            return assemblyAiScrapper;
        case ASHBY_NAME:
            return ashbyScrapper;
        case ASTRONOMER_NAME:
            return astronomerScrapper;
        case AXIOS_HQ_NAME:
            return axiosHqScrapper;
        case BLUESKY_NAME:
            return blueskyScrapper;
        case BUBBLE_NAME:
            return bubbleScrapper;
        case CHERRE_NAME:
            return cherreScrapper;
        case CHORUS_ONE_NAME:
            return chorusOneScrapper;
        case CINDER_NAME:
            return cinderScrapper;
        case CIRCLE_NAME:
            return circleScrapper;
        case CODE_SIGNAL_NAME:
            return codeSignalScrapper;
        case CONFIANT_NAME:
            return confiantScrapper;
        case CLOSE_NAME:
            return closeScrapper;
        case CUSTOMERIO_NAME:
            return customerioScrapper;
        case DISCORD_NAME:
            return discordScrapper;
        case DOCKER_NAME:
            return dockerScrapper;
        case DUOLINGO_NAME:
            return duolingoScrapper;
        case DUCK_DUCK_GO_NAME:
            return duckDuckGoScrapper;
        case FEDERATO_NAME:
            return federatoScrapper;
        case FEELD_NAME:
            return feeldScrapper;
        case FIGMA_NAME:
            return figmaScrapper;
        case FLOAT_NAME:
            return floatScrapper;
        case FULLSTORY_NAME:
            return fullstoryScrapper;
        case GITLAB_NAME:
            return gitlabScrapper;
        case GRAFANA_LABS_NAME:
            return grafanaLabsScrapper;
        case GUIDELINE_NAME:
            return guidelineScrapper;
        case HAPPY_MONEY_NAME:
            return happyMoneyScrapper;
        case HEARD_NAME:
            return heardScrapper;
        case HELPSCOUT_NAME:
            return helpscoutScrapper;
        case HIGHTOUCH_NAME:
            return hightouchScrapper;
        case HORIZON_3_NAME:
            return horizon3Scrapper;
        case HUMAN_INTEREST_NAME:
            return humanInterestScrapper;
        case HUMAN_SIGNAL_NAME:
            return humanSignalScrapper;
        case INCIDENT_IO_NAME:
            return incidentIoScrapper;
        case INVISIBLE_NAME:
            return invisibleScrapper;
        case KIT_NAME:
            return kitScrapper;
        case KALEPA_NAME:
            return kalepaScrapper;
        case KRAKEN_NAME:
            return krakenScrapper;
        case LAUNCHDARKLY_NAME:
            return launchDarklyScrapper;
        case LIMITLESS_NAME:
            return limitlessScrapper;
        case LATTICE_NAME:
            return latticeScrapper;
        case MAGIC_SCHOOL_NAME:
            return magicSchoolScrapper;
        case MAZE_NAME:
            return mazeScrapper;
        case MAZE_HQ_NAME:
            return mazeHqScrapper;
        case MAILER_LITE_NAME:
            return mailerLiteScrapper;
        case MATTERMOST_NAME:
            return mattermostScrapper;
        case MERCURY_NAME:
            return mercuryScrapper;
        case MIMO_NAME:
            return mimoScrapper;
        case NETLIFY_NAME:
            return netlifyScrapper;
        case ONE_PASSWORD_NAME:
            return onePasswordScrapper;
        case PARAGON_NAME:
            return paragonScrapper;
        case PHANTOM_NAME:
            return phantomScrapper;
        case PHOTOROOM_NAME:
            return photoroomScrapper;
        case PLANET_SCALE_NAME:
            return planetScaleScrapper;
        case PREFECT_NAME:
            return prefectScrapper;
        case PROTONAI_NAME:
            return protonaiScrapper;
        case POSTSCRIPT_NAME:
            return postscriptScrapper;
        case PROOF_NAME:
            return proofScrapper;
        case PULUMI_NAME:
            return pulumiScrapper;
        case RAMP_NAME:
            return rampScrapper;
        case RAVIO_NAME:
            return ravioScrapper;
        case REC_ROOM_NAME:
            return recRoomScrapper;
        case RENDER_NAME:
            return renderScrapper;
        case REVENUE_CAT_NAME:
            return revenueCatScrapper;
        case REPLIT_NAME:
            return replitScrapper;
        case RETOOL_NAME:
            return retoolScrapper;
        case RUNWAY_NAME:
            return runwayScrapper;
        case SOURCEGRAPH_NAME:
            return sourcegraphScrapper;
        case STREAK_NAME:
            return streakScrapper;
        case STRAVA_NAME:
            return stravaScrapper;
        case STRIPE_NAME:
            return stripeScrapper;
        case SUPER_NAME:
            return superScrapper;
        case SUPERHUMAN_NAME:
            return superhumanScrapper;
        case TAILSCALE_NAME:
            return tailscaleScrapper;
        case TINES_NAME:
            return tinesScrapper;
        case V7_NAME:
            return v7Scrapper;
        case LIGHTDASH_NAME:
            return lightdashScrapper;
        case TINYBIRD_NAME:
            return tinybirdScrapper;
        case ATTIO_NAME:
            return attioScrapper;
        case BUFFER_NAME:
            return bufferScrapper;
        case BUILDER_NAME:
            return builderScrapper;
        case CALENDLY_NAME:
            return calendlyScrapper;
        case CAMUNDA_NAME:
            return camundaScrapper;
        case CHECKLY_NAME:
            return checklyScrapper;
        case CHROMATIC_NAME:
            return chromaticScrapper;
        case CLICKUP_NAME:
            return clickUpScrapper;
        case CONSENSYS_NAME:
            return consensysScrapper;
        case CYBERHAVEN_NAME:
            return cyberhavenScrapper;
        case DEEPGRAM_NAME:
            return deepgramScrapper;
        case DESCRIPT_NAME:
            return descriptScrapper;
        case DUALENTRY_NAME:
            return dualentryScrapper;
        case FINGERPRINT_NAME:
            return fingerprintScrapper;
        case FREEWILL_NAME:
            return freewillScrapper;
        case GEM_NAME:
            return gemScrapper;
        case GUSTO_NAME:
            return gustoScrapper;
        case HOP_SKIP_DRIVE_NAME:
            return hopSkipDriveScrapper;
        case ISTARI_DIGITAL_NAME:
            return istariDigitalScrapper;
        case MYSTEN_LABS_NAME:
            return mystenLabsScrapper;
        case REGRELLO_NAME:
            return regrelloScrapper;
        case RIVER_NAME:
            return riverScrapper;
        case SANDBOX_AQ_NAME:
            return sandboxAQScrapper;
        case SENTRY_NAME:
            return sentryScrapper;
        case SUPERMOVE_NAME:
            return supermoveScrapper;
        case VERCEL_NAME:
            return vercelScrapper;
        case WAVE_NAME:
            return waveScrapper;
        case WEBFLOW_NAME:
            return webflowScrapper;
        case WISPR_FLOW_NAME:
            return wisprFlowScrapper;
        case WORKOS_NAME:
            return workOsScrapper;
        case ABNORMAL_SECURITY_NAME:
            return abnormalSecurityScrapper;
        case BITWARDEN_NAME:
            return bitwardenScrapper;
        case CRIBL_NAME:
            return criblScrapper;
        case DOXIMITY_NAME:
            return doximityScrapper;
        case EXPEL_NAME:
            return expelScrapper;
        case GLIDE_NAME:
            return glideScrapper;
        case GOLINKS_NAME:
            return goLinksScrapper;
        case HONEYCOMB_NAME:
            return honeycombScrapper;
        case ITERABLE_NAME:
            return iterableScrapper;
        case MARQETA_NAME:
            return marqetaScrapper;
        case MATERIALIZE_NAME:
            return materializeScrapper;
        case OSO_NAME:
            return osoScrapper;
        case OUTSCHOOL_NAME:
            return outschoolScrapper;
        case RESEND_NAME:
            return resendScrapper;
        case SPRIG_NAME:
            return sprigScrapper;
        case STYTCH_NAME:
            return stytchScrapper;
        case SUBSTACK_NAME:
            return substackScrapper;
        case TEMPORAL_NAME:
            return temporalScrapper;
        case VULTR_NAME:
            return vultrScrapper;
        case WIKIMEDIA_NAME:
            return wikimediaScrapper;
        case TWITCH_NAME:
            return twitchScrapper;
        case ZAPIER_NAME:
            return zapierScrapper;
        case ZERO_X_NAME:
            return zeroXScrapper;
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
