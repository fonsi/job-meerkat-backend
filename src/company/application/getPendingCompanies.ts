import { Company } from 'company/domain/company';
import {
    DEV_COMPANY_TABLE,
    PRODUCTION_COMPANY_TABLE,
} from 'company/infrastructure/admin/constants';
import { getAllFromTable } from 'company/infrastructure/admin/companyTables';
import {
    hasLogo,
    hasOg,
    readSampleJobs,
    SampleJobsFile,
} from 'company/infrastructure/admin/pendingArtifacts';

export type PendingCompany = Company & {
    hasLogo: boolean;
    hasOg: boolean;
    sampleJobs: SampleJobsFile | null;
};

export const getPendingCompanies = async (): Promise<PendingCompany[]> => {
    const [devCompanies, prodCompanies] = await Promise.all([
        getAllFromTable(DEV_COMPANY_TABLE),
        getAllFromTable(PRODUCTION_COMPANY_TABLE),
    ]);
    const prodIds = new Set(prodCompanies.map((company) => company.id));

    return devCompanies
        .filter((company) => !prodIds.has(company.id))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((company) => ({
            ...company,
            hasLogo: hasLogo(company.id),
            hasOg: hasOg(company.id),
            sampleJobs: readSampleJobs(company.id),
        }));
};
