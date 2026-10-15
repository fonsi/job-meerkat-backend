import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { CompanyId } from 'company/domain/company';
import { ScrappedJobPost } from 'company/infrastructure/scrapping/companyScrapper';

export type SampleJobsFile = {
    companyId: CompanyId;
    listedCount: number;
    listedTitles: string[];
    sampledAt: string;
    sampleSize: number;
    jobs: ScrappedJobPost[];
};

export const getPendingRoot = (): string =>
    process.env.PENDING_ARTIFACTS_DIR || join(process.cwd(), '.local/pending');

export const getPendingDir = (companyId: CompanyId): string =>
    join(getPendingRoot(), companyId);

export const getSampleJobsPath = (companyId: CompanyId): string =>
    join(getPendingDir(companyId), 'sample-jobs.json');

export const getLogoPath = (companyId: CompanyId): string =>
    join(getPendingDir(companyId), 'logo.png');

export const getOgPath = (companyId: CompanyId): string =>
    join(getPendingDir(companyId), 'og.png');

export const ensurePendingDir = (companyId: CompanyId): void => {
    mkdirSync(getPendingDir(companyId), { recursive: true });
};

export const writeSampleJobs = (sample: SampleJobsFile): void => {
    ensurePendingDir(sample.companyId);
    writeFileSync(
        getSampleJobsPath(sample.companyId),
        JSON.stringify(sample, null, 2),
    );
};

export const readSampleJobs = (companyId: CompanyId): SampleJobsFile | null => {
    const path = getSampleJobsPath(companyId);
    if (!existsSync(path)) return null;

    return JSON.parse(readFileSync(path, 'utf8')) as SampleJobsFile;
};

export const writeLogo = (companyId: CompanyId, png: Buffer): void => {
    ensurePendingDir(companyId);
    writeFileSync(getLogoPath(companyId), png);
};

export const readLogo = (companyId: CompanyId): Buffer | null => {
    const path = getLogoPath(companyId);
    if (!existsSync(path)) return null;

    return readFileSync(path);
};

export const hasLogo = (companyId: CompanyId): boolean =>
    existsSync(getLogoPath(companyId));

export const writeOg = (companyId: CompanyId, png: Buffer): void => {
    ensurePendingDir(companyId);
    writeFileSync(getOgPath(companyId), png);
};

export const readOg = (companyId: CompanyId): Buffer | null => {
    const path = getOgPath(companyId);
    if (!existsSync(path)) return null;

    return readFileSync(path);
};

export const hasOg = (companyId: CompanyId): boolean =>
    existsSync(getOgPath(companyId));
