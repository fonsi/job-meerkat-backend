import { CompanyId } from 'company/domain/company';
import {
    DEV_COMPANY_TABLE,
    PRODUCTION_COMPANY_TABLE,
} from 'company/infrastructure/admin/constants';
import {
    getByIdFromTable,
    putCompanyInTable,
} from 'company/infrastructure/admin/companyTables';
import {
    readLogo,
    readOg,
} from 'company/infrastructure/admin/pendingArtifacts';
import {
    uploadCompanyLogo,
    uploadCompanyOg,
} from 'company/infrastructure/admin/s3LogoUpload';
import { generatePendingCompanyOgImage } from './generatePendingCompanyOgImage';

type PromoteCompanyCommand = {
    companyId: CompanyId;
};

export const promoteCompany = async ({
    companyId,
}: PromoteCompanyCommand): Promise<void> => {
    const company = await getByIdFromTable(DEV_COMPANY_TABLE, companyId);
    if (!company) {
        throw new Error(
            `Company not found in ${DEV_COMPANY_TABLE} - ${companyId}`,
        );
    }

    const existing = await getByIdFromTable(
        PRODUCTION_COMPANY_TABLE,
        companyId,
    );
    if (existing) {
        throw new Error(
            `Company already exists in ${PRODUCTION_COMPANY_TABLE} - ${companyId}`,
        );
    }

    const logo = readLogo(companyId);
    if (!logo) {
        throw new Error(`Missing logo at .local/pending/${companyId}/logo.png`);
    }

    let og = readOg(companyId);
    if (!og) og = await generatePendingCompanyOgImage({ companyId });

    await putCompanyInTable(PRODUCTION_COMPANY_TABLE, company);
    await uploadCompanyLogo({ companyId, body: logo });
    await uploadCompanyOg({ companyId, body: og });
};
