import { Company } from 'company/domain/company';
import { makeCompanyOgImageKey } from 'company/domain/makeCompanyOgImageUrl';
import {
    BrandAssets,
    loadBrandAssets,
} from 'jobPost/infrastructure/og/loadBrandAssets';
import { renderCompanyOgImage } from 'jobPost/infrastructure/og/renderBrandOgImages';
import { uploadAssetPng } from 'shared/infrastructure/assets/uploadAssetPng';

const loadOptionalPng = async (url: string): Promise<Buffer | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;

        return Buffer.from(await response.arrayBuffer());
    } catch {
        return null;
    }
};

export const generateAndStoreCompanyOgImage = async ({
    company,
    brand,
}: {
    company: Company;
    brand?: BrandAssets;
}): Promise<void> => {
    const assets = brand ?? (await loadBrandAssets());
    const logo = company.logo?.url
        ? await loadOptionalPng(company.logo.url)
        : null;
    const png = await renderCompanyOgImage({
        companyName: company.name,
        logo,
        mark: assets.mark,
        wordmark: assets.wordmark,
    });

    await uploadAssetPng({
        key: makeCompanyOgImageKey({ companyId: company.id }),
        body: png,
    });
};
