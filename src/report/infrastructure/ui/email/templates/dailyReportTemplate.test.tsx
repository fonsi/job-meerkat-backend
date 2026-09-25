import { Company, CompanyId } from 'company/domain/company';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import {
    ACME,
    companies,
    catalog,
    JobIds,
} from 'report/application/newsletterSettings.fixtures';
import { JobPostsByCompanyType } from 'report/application/sendReport';
import { buildJobReportTemplate } from './dailyReportTemplate';

/** Gmail clips HTML around 102KB; keep a safety margin. */
const GMAIL_CLIP_BUDGET_BYTES = 100_000;

const clipCompany = (index: number): Company => ({
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}` as CompanyId,
    name: `Company ${index}`,
    homePage: 'https://example.com',
    logo: { url: 'https://example.com/logo.png' },
});

const clipJobPost = (
    company: Company,
    companyIndex: number,
    jobIndex: number,
): JobPost => ({
    id: `10000000-0000-4000-8000-${String(companyIndex * 10 + jobIndex).padStart(12, '0')}` as JobPostId,
    originalId: `${companyIndex}-${jobIndex}`,
    companyId: company.id,
    type: JobType.FullTime,
    url: 'https://example.com/careers',
    title: 'Senior Backend Engineer',
    category: Category.Backend,
    salaryRange:
        (companyIndex + jobIndex) % 3 === 0
            ? null
            : { min: 120000, max: 160000, currency: 'USD', period: Period.Year },
    workplace: Workplace.Remote,
    location: 'Remote',
    createdAt: 1,
    closedAt: null,
    slug: `senior-backend-engineer-at-company-${companyIndex}-${jobIndex}`,
});

describe('buildJobReportTemplate', () => {
    const acme = companies.find((company) => company.id === ACME)!;
    const withSalary = catalog.find(
        (job) => job.id === JobIds.acmeRemoteSalaryBackend,
    )!;
    const withoutSalary = catalog.find(
        (job) => job.id === JobIds.acmeRemoteNoSalaryBackend,
    )!;

    it('renders two-line salary column when salary exists', async () => {
        const { html } = await buildJobReportTemplate({
            jobPostsByCompany: {
                [ACME]: { company: acme, jobPosts: [withSalary] },
            },
            totalJobPosts: 1,
            totalCompanies: 1,
            frequency: 'daily',
            manageUrl: 'https://example.com/manage',
            unsubscribeUrl: 'https://example.com/unsubscribe',
        });

        expect(html).toContain('#D6FF3F');
        expect(html).toContain('100–200');
        expect(html).toContain('USD / year');
        expect(html).toContain(withSalary.title);
        expect(html).not.toContain('<svg');
        expect(html).not.toContain('ui-avatars.com');
        expect(html).not.toContain('data-skip-in-text');
        expect(html).not.toContain('rel="preload"');
        expect(html.match(/<table/g)?.length).toBe(3);
    });

    it('omits salary column when salary is null', async () => {
        const { html } = await buildJobReportTemplate({
            jobPostsByCompany: {
                [ACME]: { company: acme, jobPosts: [withoutSalary] },
            },
            totalJobPosts: 1,
            totalCompanies: 1,
            frequency: 'daily',
            manageUrl: 'https://example.com/manage',
            unsubscribeUrl: 'https://example.com/unsubscribe',
        });

        expect(html).toContain(withoutSalary.title);
        expect(html).not.toContain('USD / year');
        expect(html).not.toContain('100–200');
    });

    it('keeps a short plain-text alternative', async () => {
        const { text } = await buildJobReportTemplate({
            jobPostsByCompany: {
                [ACME]: { company: acme, jobPosts: [withSalary] },
            },
            totalJobPosts: 1,
            totalCompanies: 1,
            frequency: 'daily',
            manageUrl: 'https://example.com/manage',
            unsubscribeUrl: 'https://example.com/unsubscribe',
        });

        expect(text).toContain('1 new jobs · 1 companies');
        expect(text).toContain('Browse all on Jobmeerkat');
        expect(text).not.toContain(withSalary.title);
    });

    it('keeps a 110-job report under the Gmail clip budget', async () => {
        const jobCounts = [
            ...Array(8).fill(1),
            ...Array(10).fill(2),
            ...Array(10).fill(3),
            ...Array(8).fill(4),
            ...Array(4).fill(5),
        ];
        const entries = jobCounts.map((jobCount, companyIndex) => {
            const company = clipCompany(companyIndex);

            return {
                company,
                jobPosts: Array.from({ length: jobCount }, (_, jobIndex) =>
                    clipJobPost(company, companyIndex, jobIndex),
                ),
            };
        });
        const jobPostsByCompany: JobPostsByCompanyType = Object.fromEntries(
            entries.map(({ company, jobPosts }) => [
                company.id,
                { company, jobPosts },
            ]),
        );
        const totalJobPosts = Object.values(jobPostsByCompany).reduce(
            (total, { jobPosts }) => total + jobPosts.length,
            0,
        );

        const { html } = await buildJobReportTemplate({
            jobPostsByCompany,
            totalJobPosts,
            totalCompanies: entries.length,
            frequency: 'daily',
            manageUrl: 'https://jobmeerkat.com/newsletter',
            unsubscribeUrl:
                'https://jobmeerkat.com/newsletter/unsubscribe?t=test',
        });

        expect(totalJobPosts).toBe(110);
        expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(
            GMAIL_CLIP_BUDGET_BYTES,
        );
    });
});
