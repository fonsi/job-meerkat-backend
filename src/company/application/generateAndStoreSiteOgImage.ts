import { SITE_OG_IMAGE_KEY } from 'company/domain/makeCompanyOgImageUrl';
import {
    BrandAssets,
    loadBrandAssets,
} from 'jobPost/infrastructure/og/loadBrandAssets';
import { renderSiteOgImage } from 'jobPost/infrastructure/og/renderBrandOgImages';
import { uploadAssetPng } from 'shared/infrastructure/assets/uploadAssetPng';

export const generateAndStoreSiteOgImage = async (
    brand?: BrandAssets,
): Promise<void> => {
    const assets = brand ?? (await loadBrandAssets());
    const png = await renderSiteOgImage(assets);

    await uploadAssetPng({ key: SITE_OG_IMAGE_KEY, body: png });
};
