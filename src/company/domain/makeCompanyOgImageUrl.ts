import { ASSETS_BASE_URL } from 'shared/infrastructure/assets/constants';
import { CompanyId } from './company';

export const makeCompanyOgImageKey = ({
    companyId,
}: {
    companyId: CompanyId;
}) => `company/${companyId}/og.png`;

export const SITE_OG_IMAGE_KEY = 'og.png';

export const makeCompanyOgImageUrl = ({
    companyId,
}: {
    companyId: CompanyId;
}) => `${ASSETS_BASE_URL}/${makeCompanyOgImageKey({ companyId })}`;

export const makeSiteOgImageUrl = () =>
    `${ASSETS_BASE_URL}/${SITE_OG_IMAGE_KEY}`;
