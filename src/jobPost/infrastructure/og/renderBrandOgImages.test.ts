import { renderCompanyOgImage, renderSiteOgImage } from './renderBrandOgImages';

const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
);

const expectPng = (image: Buffer) => {
    expect(image.subarray(0, 8)).toEqual(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    expect(image.readUInt32BE(16)).toBe(1200);
    expect(image.readUInt32BE(20)).toBe(630);
};

describe('renderBrandOgImages', () => {
    it('renders a company card and the site card', async () => {
        const company = await renderCompanyOgImage({
            companyName: 'GitLab',
            logo: png,
            mark: png,
            wordmark: png,
        });
        const site = await renderSiteOgImage({ mark: png, wordmark: png });

        expectPng(company);
        expectPng(site);
    });
});
