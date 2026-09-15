import { filterJobPostsForNewsletter } from './filterJobPostsForNewsletter';
import {
    ACME,
    JobIds,
    OTHER,
    filterCatalog,
    openPrefs,
    idsOf,
} from './newsletterSettings.fixtures';
import { newsletterPreferencesDefaults } from 'report/domain/newsletterPreferences';

const {
    acmeRemoteSalaryBackend,
    acmeOnsiteSalaryBackend,
    acmeRemoteNoSalaryBackend,
    acmeHybridSalaryFrontend,
    acmeOnsiteNoSalaryFrontend,
    otherRemoteSalaryBackend,
    otherOnsiteNoSalaryFrontend,
    otherRemoteSalaryFrontend,
    otherHybridSalaryBackend,
} = JobIds;

const allAcme = [
    acmeRemoteSalaryBackend,
    acmeOnsiteSalaryBackend,
    acmeRemoteNoSalaryBackend,
    acmeHybridSalaryFrontend,
    acmeOnsiteNoSalaryFrontend,
];
const allOther = [
    otherRemoteSalaryBackend,
    otherOnsiteNoSalaryFrontend,
    otherRemoteSalaryFrontend,
    otherHybridSalaryBackend,
];

const cases: {
    name: string;
    prefs: Parameters<typeof filterJobPostsForNewsletter>[1];
    expected: string[];
}[] = [
    {
        name: 'undefined prefs → default remote + public salary',
        prefs: undefined,
        expected: [
            acmeRemoteSalaryBackend,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'explicit defaults match undefined prefs',
        prefs: newsletterPreferencesDefaults(),
        expected: [
            acmeRemoteSalaryBackend,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'all dimensions open',
        prefs: openPrefs(),
        expected: [...allAcme, ...allOther],
    },
    {
        name: 'public salary only',
        prefs: openPrefs({ publicSalaryOnly: true }),
        expected: [
            acmeRemoteSalaryBackend,
            acmeOnsiteSalaryBackend,
            acmeHybridSalaryFrontend,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
            otherHybridSalaryBackend,
        ],
    },
    {
        name: 'remote only',
        prefs: openPrefs({ allowedWorkplaces: ['remote'] }),
        expected: [
            acmeRemoteSalaryBackend,
            acmeRemoteNoSalaryBackend,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'on-site only',
        prefs: openPrefs({ allowedWorkplaces: ['on-site'] }),
        expected: [
            acmeOnsiteSalaryBackend,
            acmeOnsiteNoSalaryFrontend,
            otherOnsiteNoSalaryFrontend,
        ],
    },
    {
        name: 'hybrid only',
        prefs: openPrefs({ allowedWorkplaces: ['hybrid'] }),
        expected: [acmeHybridSalaryFrontend, otherHybridSalaryBackend],
    },
    {
        name: 'remote + on-site',
        prefs: openPrefs({ allowedWorkplaces: ['remote', 'on-site'] }),
        expected: [
            acmeRemoteSalaryBackend,
            acmeOnsiteSalaryBackend,
            acmeRemoteNoSalaryBackend,
            acmeOnsiteNoSalaryFrontend,
            otherRemoteSalaryBackend,
            otherOnsiteNoSalaryFrontend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'all workplaces listed',
        prefs: openPrefs({
            allowedWorkplaces: ['remote', 'on-site', 'hybrid'],
        }),
        expected: [...allAcme, ...allOther],
    },
    {
        name: 'backend category',
        prefs: openPrefs({ allowedCategorySlugs: ['backend'] }),
        expected: [
            acmeRemoteSalaryBackend,
            acmeOnsiteSalaryBackend,
            acmeRemoteNoSalaryBackend,
            otherRemoteSalaryBackend,
            otherHybridSalaryBackend,
        ],
    },
    {
        name: 'frontend category',
        prefs: openPrefs({ allowedCategorySlugs: ['frontend'] }),
        expected: [
            acmeHybridSalaryFrontend,
            acmeOnsiteNoSalaryFrontend,
            otherOnsiteNoSalaryFrontend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'backend + frontend',
        prefs: openPrefs({ allowedCategorySlugs: ['backend', 'frontend'] }),
        expected: [...allAcme, ...allOther],
    },
    {
        name: 'allowlist Acme',
        prefs: openPrefs({ allowedCompanyIds: [ACME] }),
        expected: allAcme,
    },
    {
        name: 'allowlist Other',
        prefs: openPrefs({ allowedCompanyIds: [OTHER] }),
        expected: allOther,
    },
    {
        name: 'Acme + remote + public salary',
        prefs: openPrefs({
            allowedCompanyIds: [ACME],
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
        }),
        expected: [acmeRemoteSalaryBackend],
    },
    {
        name: 'remote + public salary + includeAll Acme',
        prefs: openPrefs({
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [{ companyId: ACME, includeAll: true }],
        }),
        expected: [
            ...allAcme,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'remote + public salary + Acme any workplace',
        prefs: openPrefs({
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [{ companyId: ACME, allowedWorkplaces: null }],
        }),
        expected: [
            acmeRemoteSalaryBackend,
            acmeOnsiteSalaryBackend,
            acmeHybridSalaryFrontend,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'remote + public salary + Acme any salary',
        prefs: openPrefs({
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [{ companyId: ACME, publicSalaryOnly: false }],
        }),
        expected: [
            acmeRemoteSalaryBackend,
            acmeRemoteNoSalaryBackend,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'salary optional globally + Acme public salary only',
        prefs: openPrefs({
            companyRules: [{ companyId: ACME, publicSalaryOnly: true }],
        }),
        expected: [
            acmeRemoteSalaryBackend,
            acmeOnsiteSalaryBackend,
            acmeHybridSalaryFrontend,
            ...allOther,
        ],
    },
    {
        name: 'backend globally + Acme frontend only',
        prefs: openPrefs({
            allowedCategorySlugs: ['backend'],
            companyRules: [
                { companyId: ACME, allowedCategorySlugs: ['frontend'] },
            ],
        }),
        expected: [
            acmeHybridSalaryFrontend,
            acmeOnsiteNoSalaryFrontend,
            otherRemoteSalaryBackend,
            otherHybridSalaryBackend,
        ],
    },
    {
        name: 'frontend globally + Acme any category',
        prefs: openPrefs({
            allowedCategorySlugs: ['frontend'],
            companyRules: [{ companyId: ACME, allowedCategorySlugs: null }],
        }),
        expected: [
            ...allAcme,
            otherOnsiteNoSalaryFrontend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'Acme all-fields-any matches includeAll',
        prefs: openPrefs({
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [
                {
                    companyId: ACME,
                    allowedCategorySlugs: null,
                    allowedWorkplaces: null,
                    publicSalaryOnly: false,
                },
            ],
        }),
        expected: [
            ...allAcme,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
    {
        name: 'exclude Acme',
        prefs: openPrefs({
            companyRules: [{ companyId: ACME, exclude: true }],
        }),
        expected: allOther,
    },
    {
        name: 'exclude Acme and includeAll Other',
        prefs: openPrefs({
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [
                { companyId: ACME, exclude: true },
                { companyId: OTHER, includeAll: true },
            ],
        }),
        expected: allOther,
    },
    {
        name: 'exclude wins over includeAll on the same company',
        prefs: openPrefs({
            companyRules: [
                { companyId: ACME, exclude: true, includeAll: true },
            ],
        }),
        expected: allOther,
    },
    {
        name: 'allowlist Acme ignores includeAll on Other',
        prefs: openPrefs({
            allowedCompanyIds: [ACME],
            companyRules: [{ companyId: OTHER, includeAll: true }],
        }),
        expected: allAcme,
    },
    {
        name: 'allowlist Acme + includeAll Acme keeps every Acme offer',
        prefs: openPrefs({
            allowedCompanyIds: [ACME],
            allowedWorkplaces: ['remote'],
            publicSalaryOnly: true,
            companyRules: [{ companyId: ACME, includeAll: true }],
        }),
        expected: allAcme,
    },
    {
        name: 'Acme on-site only while global is remote',
        prefs: openPrefs({
            allowedWorkplaces: ['remote'],
            companyRules: [{ companyId: ACME, allowedWorkplaces: ['on-site'] }],
        }),
        expected: [
            acmeOnsiteSalaryBackend,
            acmeOnsiteNoSalaryFrontend,
            otherRemoteSalaryBackend,
            otherRemoteSalaryFrontend,
        ],
    },
];

describe('filterJobPostsForNewsletter settings matrix', () => {
    it.each(cases)('$name', ({ prefs, expected }) => {
        expect(
            idsOf(filterJobPostsForNewsletter(filterCatalog, prefs)),
        ).toEqual([...expected].sort());
    });
});
