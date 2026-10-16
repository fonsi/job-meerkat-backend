import { CompanyId } from 'company/domain/company';
import { DEV_COMPANY_TABLE } from 'company/infrastructure/admin/constants';
import { getByIdFromTable } from 'company/infrastructure/admin/companyTables';
import {
    hasLogo,
    readLogo,
    writeOg,
} from 'company/infrastructure/admin/pendingArtifacts';
import { loadBrandAssets } from 'jobPost/infrastructure/og/loadBrandAssets';
import { renderCompanyOgImage } from 'jobPost/infrastructure/og/renderBrandOgImages';
import { loadLocalAwsEnv } from 'shared/infrastructure/env/loadLocalAwsEnv';

type GeneratePendingCompanyOgImageCommand = {
    companyId: CompanyId;
};

export const generatePendingCompanyOgImage = async ({
    companyId,
}: GeneratePendingCompanyOgImageCommand): Promise<Buffer> => {
    loadLocalAwsEnv();
    if (!hasLogo(companyId)) {
        throw new Error(
            `Upload a logo before generating the OG image (.local/pending/${companyId}/logo.png)`,
        );
    }

    const company = await getByIdFromTable(DEV_COMPANY_TABLE, companyId);
    if (!company) {
        throw new Error(
            `Company not found in ${DEV_COMPANY_TABLE} - ${companyId}`,
        );
    }

    const logo = readLogo(companyId);
    if (!logo) {
        throw new Error(`Missing logo at .local/pending/${companyId}/logo.png`);
    }

    const brand = await loadBrandAssets();
    const png = await renderCompanyOgImage({
        companyName: company.name,
        logo,
        mark: brand.mark,
        wordmark: brand.wordmark,
    });
    writeOg(companyId, png);

    return png;
};
