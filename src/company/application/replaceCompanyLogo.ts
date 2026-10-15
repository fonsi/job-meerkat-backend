import { CompanyId } from 'company/domain/company';
import { LOGO_WIDTH_PX } from 'company/infrastructure/admin/constants';
import { writeLogo } from 'company/infrastructure/admin/pendingArtifacts';
import { generatePendingCompanyOgImage } from './generatePendingCompanyOgImage';
import { processLogoBuffer } from './processCompanyLogo';

type ReplaceCompanyLogoCommand = {
    companyId: CompanyId;
    input: Buffer;
};

export const replaceCompanyLogo = async ({
    companyId,
    input,
}: ReplaceCompanyLogoCommand): Promise<Buffer> => {
    const png = await processLogoBuffer(input, {
        forceWhite: false,
        width: LOGO_WIDTH_PX,
    });
    writeLogo(companyId, png);
    await generatePendingCompanyOgImage({ companyId });

    return png;
};
