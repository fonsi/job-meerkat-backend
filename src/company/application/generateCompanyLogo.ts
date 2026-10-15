import { CompanyId } from 'company/domain/company';
import { loadLocalAwsEnv } from 'shared/infrastructure/env/loadLocalAwsEnv';
import {
    DEV_COMPANY_TABLE,
    LOGO_WIDTH_PX,
} from 'company/infrastructure/admin/constants';
import { getByIdFromTable } from 'company/infrastructure/admin/companyTables';
import { captureHomepage } from 'company/infrastructure/admin/captureHomepage';
import { writeLogo } from 'company/infrastructure/admin/pendingArtifacts';
import { convertLogoToWhiteMark } from './convertLogoToWhiteMark';
import { generatePendingCompanyOgImage } from './generatePendingCompanyOgImage';
import { pickLogoCandidate } from './pickLogoCandidate';
import { processLogoBuffer } from './processCompanyLogo';

type GenerateCompanyLogoCommand = {
    companyId: CompanyId;
};

const FETCH_TIMEOUT_MS = 15000;

const fetchBuffer = async (url: string): Promise<Buffer | null> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    timeout.unref?.();
    try {
        const response = await fetch(url, {
            signal: controller.signal,
            headers: { accept: 'image/*,image/svg+xml,*/*' },
            redirect: 'follow',
        });
        if (!response.ok) return null;
        const bytes = Buffer.from(await response.arrayBuffer());

        return bytes.length >= 32 ? bytes : null;
    } catch {
        return null;
    } finally {
        clearTimeout(timeout);
    }
};

const originalFromCandidate = async (
    src: string | undefined,
    cropPng: Buffer | undefined,
): Promise<Buffer> => {
    if (src && /^https?:/i.test(src)) {
        const downloaded = await fetchBuffer(src);
        if (downloaded) return downloaded;
    }
    if (cropPng) return cropPng;
    throw new Error('Picked logo had no usable image bytes');
};

export const generateCompanyLogo = async ({
    companyId,
}: GenerateCompanyLogoCommand): Promise<Buffer> => {
    loadLocalAwsEnv();
    const company = await getByIdFromTable(DEV_COMPANY_TABLE, companyId);
    if (!company) {
        throw new Error(
            `Company not found in ${DEV_COMPANY_TABLE} - ${companyId}`,
        );
    }
    if (!company.homePage) {
        throw new Error(`Company ${companyId} has no homePage`);
    }

    const capture = await captureHomepage(company.homePage);
    const picked = await pickLogoCandidate({
        companyName: company.name,
        homePage: company.homePage,
        capture,
    });
    const original = await originalFromCandidate(picked.src, picked.cropPng);
    const converted = await convertLogoToWhiteMark(original);
    const png = await processLogoBuffer(converted, {
        forceWhite: false,
        width: LOGO_WIDTH_PX,
    });
    writeLogo(companyId, png);
    await generatePendingCompanyOgImage({ companyId });

    return png;
};
