import { CompanyId } from 'company/domain/company';
import { writeLogo } from 'company/infrastructure/admin/pendingArtifacts';
import { generatePendingCompanyOgImage } from './generatePendingCompanyOgImage';

type ReplaceCompanyLogoCommand = {
    companyId: CompanyId;
    input: Buffer;
};

export const replaceCompanyLogo = async ({
    companyId,
    input,
}: ReplaceCompanyLogoCommand): Promise<Buffer> => {
    writeLogo(companyId, input);
    await generatePendingCompanyOgImage({ companyId });

    return input;
};
