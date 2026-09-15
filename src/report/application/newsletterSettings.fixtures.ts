import { Company, CompanyId } from 'company/domain/company';
import {
    Category,
    JobPost,
    JobPostId,
    JobType,
    Period,
    Workplace,
} from 'jobPost/domain/jobPost';
import { NewsletterPreferences } from 'report/domain/newsletterPreferences';

export const ACME = '00000000-0000-4000-8000-0000000000aa' as CompanyId;
export const OTHER = '00000000-0000-4000-8000-0000000000bb' as CompanyId;
export const DISABLED = '00000000-0000-4000-8000-0000000000cc' as CompanyId;

export const JobIds = {
    acmeRemoteSalaryBackend: '10000000-0000-4000-8000-000000000001',
    acmeOnsiteSalaryBackend: '10000000-0000-4000-8000-000000000002',
    acmeRemoteNoSalaryBackend: '10000000-0000-4000-8000-000000000003',
    acmeHybridSalaryFrontend: '10000000-0000-4000-8000-000000000004',
    acmeOnsiteNoSalaryFrontend: '10000000-0000-4000-8000-000000000005',
    otherRemoteSalaryBackend: '10000000-0000-4000-8000-000000000006',
    otherOnsiteNoSalaryFrontend: '10000000-0000-4000-8000-000000000007',
    otherRemoteSalaryFrontend: '10000000-0000-4000-8000-000000000008',
    otherHybridSalaryBackend: '10000000-0000-4000-8000-000000000009',
    disabledRemoteSalaryBackend: '10000000-0000-4000-8000-00000000000a',
} as const;

const salary = { min: 100, max: 200, currency: 'USD', period: Period.Year };

const post = (overrides: Partial<JobPost>): JobPost => ({
    id: JobIds.acmeRemoteSalaryBackend as JobPostId,
    originalId: 'x',
    companyId: ACME,
    type: JobType.FullTime,
    url: 'https://example.com',
    title: 'Engineer',
    category: Category.Backend,
    salaryRange: salary,
    workplace: Workplace.Remote,
    location: 'Earth',
    createdAt: 1,
    closedAt: null,
    slug: 'engineer',
    ...overrides,
});

export const catalog: JobPost[] = [
    post({
        id: JobIds.acmeRemoteSalaryBackend as JobPostId,
        slug: 'acme-remote-salary-backend',
    }),
    post({
        id: JobIds.acmeOnsiteSalaryBackend as JobPostId,
        workplace: Workplace.OnSite,
        slug: 'acme-onsite-salary-backend',
    }),
    post({
        id: JobIds.acmeRemoteNoSalaryBackend as JobPostId,
        salaryRange: null,
        slug: 'acme-remote-nosalary-backend',
    }),
    post({
        id: JobIds.acmeHybridSalaryFrontend as JobPostId,
        workplace: Workplace.Hybrid,
        category: Category.Frontend,
        slug: 'acme-hybrid-salary-frontend',
    }),
    post({
        id: JobIds.acmeOnsiteNoSalaryFrontend as JobPostId,
        workplace: Workplace.OnSite,
        category: Category.Frontend,
        salaryRange: null,
        slug: 'acme-onsite-nosalary-frontend',
    }),
    post({
        id: JobIds.otherRemoteSalaryBackend as JobPostId,
        companyId: OTHER,
        slug: 'other-remote-salary-backend',
    }),
    post({
        id: JobIds.otherOnsiteNoSalaryFrontend as JobPostId,
        companyId: OTHER,
        workplace: Workplace.OnSite,
        category: Category.Frontend,
        salaryRange: null,
        slug: 'other-onsite-nosalary-frontend',
    }),
    post({
        id: JobIds.otherRemoteSalaryFrontend as JobPostId,
        companyId: OTHER,
        category: Category.Frontend,
        slug: 'other-remote-salary-frontend',
    }),
    post({
        id: JobIds.otherHybridSalaryBackend as JobPostId,
        companyId: OTHER,
        workplace: Workplace.Hybrid,
        slug: 'other-hybrid-salary-backend',
    }),
    post({
        id: JobIds.disabledRemoteSalaryBackend as JobPostId,
        companyId: DISABLED,
        slug: 'disabled-remote-salary-backend',
    }),
];

export const filterCatalog = catalog.filter(
    (job) => job.companyId !== DISABLED,
);

export const companies: Company[] = [
    {
        id: ACME,
        name: 'Acme',
        homePage: 'https://acme.example',
        logo: { url: 'https://example.com/acme.png' },
    },
    {
        id: OTHER,
        name: 'Other',
        homePage: 'https://other.example',
        logo: { url: 'https://example.com/other.png' },
    },
    {
        id: DISABLED,
        name: 'Disabled Co',
        homePage: 'https://disabled.example',
        logo: { url: 'https://example.com/disabled.png' },
        status: 'disabled',
    },
];

export const openPrefs = (
    overrides: Partial<NewsletterPreferences> = {},
): NewsletterPreferences => ({
    allowedCategorySlugs: null,
    allowedCompanyIds: null,
    allowedWorkplaces: null,
    publicSalaryOnly: false,
    companyRules: null,
    updatedAt: 1,
    ...overrides,
});

export const idsOf = (jobs: JobPost[]) => jobs.map((job) => job.id).sort();
