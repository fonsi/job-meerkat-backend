import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import { Company, CompanyId } from 'company/domain/company';
import { captureHomepage } from 'company/infrastructure/admin/captureHomepage';
import { getByIdFromTable } from 'company/infrastructure/admin/companyTables';
import { readLogo } from 'company/infrastructure/admin/pendingArtifacts';
import { convertLogoToWhiteMark } from './convertLogoToWhiteMark';
import { generateCompanyLogo } from './generateCompanyLogo';
import { pickLogoCandidate } from './pickLogoCandidate';

jest.mock('company/infrastructure/admin/companyTables', () => ({
    getByIdFromTable: jest.fn(),
}));

jest.mock('company/infrastructure/admin/captureHomepage', () => ({
    captureHomepage: jest.fn(),
}));

jest.mock('./pickLogoCandidate', () => ({
    pickLogoCandidate: jest.fn(),
}));

jest.mock('./convertLogoToWhiteMark', () => ({
    convertLogoToWhiteMark: jest.fn(),
}));

jest.mock('./generatePendingCompanyOgImage', () => ({
    generatePendingCompanyOgImage: jest
        .fn()
        .mockResolvedValue(Buffer.from('og')),
}));

const companyId = '11111111-1111-4111-8111-111111111111' as CompanyId;
const company = {
    id: companyId,
    name: 'Acme',
    homePage: 'https://acme.example/',
    logo: { url: 'https://assets.example/logo.png' },
} as Company;

describe('generateCompanyLogo', () => {
    let pendingRoot: string;
    const originalFetch = global.fetch;

    beforeEach(() => {
        pendingRoot = mkdtempSync(join(tmpdir(), 'generate-logo-'));
        process.env.PENDING_ARTIFACTS_DIR = pendingRoot;
        (getByIdFromTable as jest.Mock).mockResolvedValue(company);
    });

    afterEach(() => {
        global.fetch = originalFetch;
        delete process.env.PENDING_ARTIFACTS_DIR;
        rmSync(pendingRoot, { recursive: true, force: true });
        jest.resetAllMocks();
    });

    it('writes a 100px png from the vision-picked logo', async () => {
        const cropPng = await sharp({
            create: {
                width: 80,
                height: 40,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
        })
            .png()
            .toBuffer();
        const converted = await sharp({
            create: {
                width: 400,
                height: 200,
                channels: 4,
                background: { r: 255, g: 255, b: 255, alpha: 1 },
            },
        })
            .png()
            .toBuffer();

        (captureHomepage as jest.Mock).mockResolvedValue({
            screenshotPng: cropPng,
            finalUrl: company.homePage,
            candidates: [
                {
                    id: 0,
                    selector: '[data-logo-candidate="0"]',
                    tag: 'img',
                    cropPng,
                },
            ],
        });
        (pickLogoCandidate as jest.Mock).mockResolvedValue({
            id: 0,
            selector: '[data-logo-candidate="0"]',
            tag: 'img',
            cropPng,
        });
        (convertLogoToWhiteMark as jest.Mock).mockResolvedValue(converted);

        const png = await generateCompanyLogo({ companyId });
        const meta = await sharp(png).metadata();

        expect(captureHomepage).toHaveBeenCalledWith(company.homePage);
        expect(pickLogoCandidate).toHaveBeenCalled();
        expect(convertLogoToWhiteMark).toHaveBeenCalled();
        expect(meta.format).toBe('png');
        expect(meta.width).toBe(100);
        expect(readLogo(companyId)?.equals(png)).toBe(true);
    });
});
