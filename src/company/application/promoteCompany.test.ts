import { Company, CompanyId } from 'company/domain/company';
import { promoteCompany } from './promoteCompany';
import {
    getByIdFromTable,
    putCompanyInTable,
} from 'company/infrastructure/admin/companyTables';
import {
    readLogo,
    readOg,
} from 'company/infrastructure/admin/pendingArtifacts';
import {
    uploadCompanyLogo,
    uploadCompanyOg,
} from 'company/infrastructure/admin/s3LogoUpload';
import { generatePendingCompanyOgImage } from './generatePendingCompanyOgImage';

jest.mock('company/infrastructure/admin/companyTables', () => ({
    getByIdFromTable: jest.fn(),
    putCompanyInTable: jest.fn(),
}));

jest.mock('company/infrastructure/admin/pendingArtifacts', () => ({
    readLogo: jest.fn(),
    readOg: jest.fn(),
}));

jest.mock('company/infrastructure/admin/s3LogoUpload', () => ({
    uploadCompanyLogo: jest.fn(),
    uploadCompanyOg: jest.fn(),
}));

jest.mock('./generatePendingCompanyOgImage', () => ({
    generatePendingCompanyOgImage: jest.fn(),
}));

const companyId = '11111111-1111-4111-8111-111111111111' as CompanyId;
const company = {
    id: companyId,
    name: 'Acme',
    homePage: 'https://acme.example',
    description: 'Widgets',
    logo: { url: 'https://assets.example/logo.png' },
} as Company;
const logo = Buffer.from('png');
const og = Buffer.from('og');

describe('promoteCompany', () => {
    beforeEach(() => {
        (getByIdFromTable as jest.Mock).mockImplementation(
            async (table: string) => {
                if (table === 'dev-company') return company;
                return null;
            },
        );
        (readLogo as jest.Mock).mockReturnValue(logo);
        (readOg as jest.Mock).mockReturnValue(og);
        (putCompanyInTable as jest.Mock).mockResolvedValue(undefined);
        (uploadCompanyLogo as jest.Mock).mockResolvedValue(undefined);
        (uploadCompanyOg as jest.Mock).mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('copies the company to prod and uploads logo + og', async () => {
        await promoteCompany({ companyId });

        expect(putCompanyInTable).toHaveBeenCalledWith(
            'production-company',
            company,
        );
        expect(uploadCompanyLogo).toHaveBeenCalledWith({
            companyId,
            body: logo,
        });
        expect(uploadCompanyOg).toHaveBeenCalledWith({
            companyId,
            body: og,
        });
        expect(generatePendingCompanyOgImage).not.toHaveBeenCalled();
    });

    it('generates og when missing before uploading', async () => {
        (readOg as jest.Mock).mockReturnValue(null);
        (generatePendingCompanyOgImage as jest.Mock).mockResolvedValue(og);

        await promoteCompany({ companyId });

        expect(generatePendingCompanyOgImage).toHaveBeenCalledWith({
            companyId,
        });
        expect(uploadCompanyOg).toHaveBeenCalledWith({
            companyId,
            body: og,
        });
    });

    it('throws when the company is already in prod', async () => {
        (getByIdFromTable as jest.Mock).mockResolvedValue(company);

        await expect(promoteCompany({ companyId })).rejects.toThrow(
            'already exists',
        );
        expect(putCompanyInTable).not.toHaveBeenCalled();
    });

    it('throws when the logo is missing', async () => {
        (readLogo as jest.Mock).mockReturnValue(null);

        await expect(promoteCompany({ companyId })).rejects.toThrow(
            'Missing logo',
        );
        expect(putCompanyInTable).not.toHaveBeenCalled();
    });
});
