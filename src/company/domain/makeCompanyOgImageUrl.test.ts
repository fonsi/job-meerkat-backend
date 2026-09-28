import { CompanyId } from './company';
import {
    makeCompanyOgImageUrl,
    makeSiteOgImageUrl,
} from './makeCompanyOgImageUrl';

jest.mock('shared/infrastructure/assets/constants', () => ({
    ASSETS_BASE_URL: 'https://test-assets.com',
}));

describe('makeCompanyOgImageUrl', () => {
    it('builds the company card path and the site card path', () => {
        const companyId = 'company-id' as CompanyId;

        expect(makeCompanyOgImageUrl({ companyId })).toBe(
            'https://test-assets.com/company/company-id/og.png',
        );
        expect(makeSiteOgImageUrl()).toBe('https://test-assets.com/og.png');
    });
});
