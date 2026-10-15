import { Company, CompanyId } from 'company/domain/company';
import { getPendingCompanies } from './getPendingCompanies';
import { getAllFromTable } from 'company/infrastructure/admin/companyTables';
import {
    hasLogo,
    hasOg,
    readSampleJobs,
} from 'company/infrastructure/admin/pendingArtifacts';

jest.mock('company/infrastructure/admin/companyTables', () => ({
    getAllFromTable: jest.fn(),
}));

jest.mock('company/infrastructure/admin/pendingArtifacts', () => ({
    hasLogo: jest.fn(),
    hasOg: jest.fn(),
    readSampleJobs: jest.fn(),
}));

const acmeId = '11111111-1111-4111-8111-111111111111' as CompanyId;
const betaId = '22222222-2222-4222-8222-222222222222' as CompanyId;
const alreadyProdId = '33333333-3333-4333-8333-333333333333' as CompanyId;

const acme = {
    id: acmeId,
    name: 'Acme',
    homePage: 'https://acme.example',
    logo: { url: 'https://assets.example/a.png' },
} as Company;
const beta = {
    id: betaId,
    name: 'Beta',
    homePage: 'https://beta.example',
    logo: { url: 'https://assets.example/b.png' },
} as Company;
const already = {
    id: alreadyProdId,
    name: 'Already',
    homePage: 'https://already.example',
    logo: { url: 'https://assets.example/c.png' },
} as Company;

describe('getPendingCompanies', () => {
    beforeEach(() => {
        (getAllFromTable as jest.Mock).mockImplementation(
            async (table: string) => {
                if (table === 'dev-company') return [beta, already, acme];
                if (table === 'production-company') return [already];

                return [];
            },
        );
        (hasLogo as jest.Mock).mockImplementation(
            (id: CompanyId) => id === acmeId,
        );
        (hasOg as jest.Mock).mockImplementation(
            (id: CompanyId) => id === acmeId,
        );
        (readSampleJobs as jest.Mock).mockReturnValue(null);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('returns dev companies missing from prod, sorted by name', async () => {
        const pending = await getPendingCompanies();

        expect(pending.map((company) => company.name)).toEqual([
            'Acme',
            'Beta',
        ]);
        expect(pending[0].hasLogo).toBe(true);
        expect(pending[0].hasOg).toBe(true);
        expect(pending[1].hasLogo).toBe(false);
        expect(pending[1].hasOg).toBe(false);
    });
});
