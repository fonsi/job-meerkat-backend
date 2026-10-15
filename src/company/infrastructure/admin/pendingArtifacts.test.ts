import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { CompanyId } from 'company/domain/company';
import { Category, JobType, Workplace } from 'jobPost/domain/jobPost';
import {
    hasLogo,
    hasOg,
    readLogo,
    readOg,
    readSampleJobs,
    writeLogo,
    writeOg,
    writeSampleJobs,
} from './pendingArtifacts';

const companyId = '11111111-1111-4111-8111-111111111111' as CompanyId;

describe('pendingArtifacts', () => {
    let pendingRoot: string;

    beforeEach(() => {
        pendingRoot = mkdtempSync(join(tmpdir(), 'pending-artifacts-'));
        process.env.PENDING_ARTIFACTS_DIR = pendingRoot;
    });

    afterEach(() => {
        delete process.env.PENDING_ARTIFACTS_DIR;
        rmSync(pendingRoot, { recursive: true, force: true });
    });

    it('writes and reads sample jobs', () => {
        writeSampleJobs({
            companyId,
            listedCount: 2,
            listedTitles: ['Engineer', 'Designer'],
            sampledAt: '2026-09-18T00:00:00.000Z',
            sampleSize: 1,
            jobs: [
                {
                    originalId: '1',
                    companyId,
                    type: JobType.FullTime,
                    url: 'https://example.com/job',
                    title: 'Engineer',
                    category: Category.Backend,
                    salaryRange: null,
                    workplace: Workplace.Remote,
                    location: 'Worldwide',
                    createdAt: 1,
                },
            ],
        });

        const sample = readSampleJobs(companyId);
        expect(sample?.listedCount).toBe(2);
        expect(sample?.jobs[0].title).toBe('Engineer');
        expect(
            readSampleJobs('22222222-2222-4222-8222-222222222222' as CompanyId),
        ).toBeNull();
    });

    it('writes and reads a logo png', () => {
        const png = Buffer.from([1, 2, 3, 4]);
        expect(hasLogo(companyId)).toBe(false);

        writeLogo(companyId, png);

        expect(hasLogo(companyId)).toBe(true);
        expect(readLogo(companyId)?.equals(png)).toBe(true);
        expect(
            readFileSync(join(pendingRoot, companyId, 'logo.png')).equals(png),
        ).toBe(true);
    });

    it('writes and reads an og png', () => {
        const png = Buffer.from([9, 8, 7, 6]);
        expect(hasOg(companyId)).toBe(false);

        writeOg(companyId, png);

        expect(hasOg(companyId)).toBe(true);
        expect(readOg(companyId)?.equals(png)).toBe(true);
    });
});
