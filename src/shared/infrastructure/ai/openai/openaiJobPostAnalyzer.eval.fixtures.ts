import { Category, JobType, Period, Workplace } from 'jobPost/domain/jobPost';
import { OpenaiJobPost } from './parseOpenaiJobPost';

export type AnalyzerGoldExpectation = {
    category: Category;
    type: JobType;
    workplace: Workplace;
    location: string;
    salary?: {
        min: number | null;
        max: number | null;
        currency?: string;
        period?: Period;
    };
    requiredStack?: string[];
    requiredTeamSubstring?: string;
    forbiddenDetailSubstrings?: string[];
    omitTeam?: boolean;
};

export type AnalyzerEvalFixture = {
    id: string;
    content: string;
    gold: AnalyzerGoldExpectation;
};

export const openaiJobPostAnalyzerEvalFixtures: AnalyzerEvalFixture[] = [
    {
        id: 'clear-backend-with-salary',
        content: `
Title: Senior Backend Engineer
Type: Full-time
Workplace: Remote
Location: Available worldwide
Salary: $140,000 – $180,000 USD per year

About the role:
Join the Payments Platform squad to design and operate high-throughput APIs that move money for small businesses.

Tech: Go, PostgreSQL, Kafka, AWS

Responsibilities:
- Build and maintain payment APIs
- Improve reliability of settlement jobs

Requirements:
- 5+ years backend experience
- Strong Go and SQL skills

Benefits:
- Early-exercisable equity
- 16 weeks paid parental leave

Hiring process:
1. Recruiter screen
2. Technical interview
3. System design
4. Hiring manager interview

Equal Opportunity Employer. We do not discriminate based on race, gender, or disability.
We process applicant data in accordance with GDPR and CCPA.
`,
        gold: {
            category: Category.Backend,
            type: JobType.FullTime,
            workplace: Workplace.Remote,
            location: 'worldwide',
            salary: {
                min: 140000,
                max: 180000,
                currency: 'usd',
                period: Period.Year,
            },
            requiredStack: ['Go', 'PostgreSQL', 'Kafka'],
            requiredTeamSubstring: 'Payments',
            forbiddenDetailSubstrings: [
                'Equal Opportunity',
                'GDPR',
                'CCPA',
                'discriminate',
            ],
        },
    },
    {
        id: 'clear-frontend',
        content: `
Frontend Engineer — Full Time — Hybrid — Berlin, Germany

You'll own customer-facing React experiences for our dashboard.

Stack includes TypeScript, React, Next.js, and GraphQL.

Requirements: deep React experience, accessibility awareness.
Nice to have: Storybook.
`,
        gold: {
            category: Category.Frontend,
            type: JobType.FullTime,
            workplace: Workplace.Hybrid,
            location: 'Berlin, Germany',
            salary: { min: null, max: null },
            requiredStack: ['TypeScript', 'React'],
            omitTeam: true,
        },
    },
    {
        id: 'generic-title-infer-from-stack',
        content: `
Software Engineer
Full-time · Remote · EMEA

We are hiring a software engineer for our data platform.

You will work with Python, Spark, dbt, and Snowflake to ship reliable pipelines.

No salary range published.
`,
        gold: {
            category: Category.Data,
            type: JobType.FullTime,
            workplace: Workplace.Remote,
            location: 'EMEA',
            salary: { min: null, max: null },
            requiredStack: ['Python', 'Spark'],
            omitTeam: true,
        },
    },
    {
        id: 'unknown-location-no-salary',
        content: `
Mobile Engineer (iOS)
Contract role. Fully remote.

Ship native Swift features for our consumer app. Collaborate with design on UIKit and SwiftUI screens.

Team: Consumer Mobile squad

No compensation details listed. Location eligibility is not specified.
`,
        gold: {
            category: Category.Mobile,
            type: JobType.Contract,
            workplace: Workplace.Remote,
            location: 'unknown',
            salary: { min: null, max: null },
            requiredStack: ['Swift'],
            requiredTeamSubstring: 'Consumer Mobile',
        },
    },
    {
        id: 'product-manager',
        content: `
Product Manager, Growth
Full-time · On-site · New York, NY

Lead discovery and delivery for acquisition funnels. Partner with design and engineering.

This is not a software engineering role. No programming stack is required.

Salary: $160,000 to $190,000 USD yearly.
`,
        gold: {
            category: Category.Product,
            type: JobType.FullTime,
            workplace: Workplace.OnSite,
            location: 'New York, NY',
            salary: {
                min: 160000,
                max: 190000,
                currency: 'usd',
                period: Period.Year,
            },
            omitTeam: true,
        },
    },
    {
        id: 'legal-counsel-other-or-legal',
        content: `
Commercial Counsel
Full-time · Remote · United States

Draft and negotiate SaaS customer contracts. Advise GTM teams on risk.

This is a legal role, not an engineering role. No software stack.
Salary not disclosed.
`,
        gold: {
            category: Category.Legal,
            type: JobType.FullTime,
            workplace: Workplace.Remote,
            location: 'United States',
            salary: { min: null, max: null },
            omitTeam: true,
            forbiddenDetailSubstrings: ['React', 'TypeScript', 'PostgreSQL'],
        },
    },
    {
        id: 'generic-engineering-team-omitted',
        content: `
DevOps Engineer
Full-time remote, available from anywhere in the world.

You'll join the engineering team to keep our Kubernetes clusters healthy.
Tools: Kubernetes, Terraform, AWS, Prometheus.

Salary max is €95,000 EUR per year; minimum not listed.
Competitive benefits package available.
Click apply to submit your application form.
`,
        gold: {
            category: Category.DevOps,
            type: JobType.FullTime,
            workplace: Workplace.Remote,
            location: 'worldwide',
            salary: {
                min: null,
                max: 95000,
                currency: 'eur',
                period: Period.Year,
            },
            requiredStack: ['Kubernetes', 'Terraform'],
            omitTeam: true,
            forbiddenDetailSubstrings: [
                'click apply',
                'application form',
                'competitive benefits',
            ],
        },
    },
];

export type AnalyzerFieldScore = {
    field: string;
    passed: boolean;
    detail?: string;
};

export type AnalyzerFixtureScore = {
    fixtureId: string;
    parsed: boolean;
    score: number;
    maxScore: number;
    failures: AnalyzerFieldScore[];
};

const normalizeLocation = (location: string): string =>
    location.trim().toLowerCase().replace(/\s+/g, ' ');

const locationMatches = (actual: string, expected: string): boolean => {
    const a = normalizeLocation(actual);
    const e = normalizeLocation(expected);
    if (a === e) return true;
    if (e === 'worldwide') return a.includes('world');
    if (e === 'unknown') return a === 'unknown' || a === 'n/a';
    return a.includes(e) || e.includes(a);
};

const currencyMatches = (
    actual: string | undefined,
    expected?: string,
): boolean => {
    if (!expected) return true;
    if (!actual) return false;
    return actual.toLowerCase().includes(expected.toLowerCase());
};

const salaryAmountMatches = (
    actual: number | null | undefined,
    expected: number | null,
): boolean => {
    if (expected === null) return actual == null;
    if (actual == null) return false;
    return actual === expected;
};

const detailText = (jobPost: OpenaiJobPost): string =>
    JSON.stringify(jobPost.details ?? {}).toLowerCase();

export const scoreAnalyzerResult = (
    fixture: AnalyzerEvalFixture,
    result: OpenaiJobPost | null,
    parseError?: string,
): AnalyzerFixtureScore => {
    const failures: AnalyzerFieldScore[] = [];
    let score = 0;
    let maxScore = 0;

    const check = (
        field: string,
        passed: boolean,
        detail?: string,
        weight = 1,
    ): void => {
        maxScore += weight;
        if (passed) score += weight;
        else failures.push({ field, passed, detail });
    };

    check('parsed', result != null, parseError, 2);
    if (!result) {
        return {
            fixtureId: fixture.id,
            parsed: false,
            score,
            maxScore,
            failures,
        };
    }

    const { gold } = fixture;
    check(
        'category',
        result.category === gold.category,
        `expected ${gold.category}, got ${result.category}`,
        3,
    );
    check(
        'type',
        result.type === gold.type,
        `expected ${gold.type}, got ${result.type}`,
        2,
    );
    check(
        'workplace',
        result.workplace === gold.workplace,
        `expected ${gold.workplace}, got ${result.workplace}`,
        2,
    );
    check(
        'location',
        locationMatches(String(result.location ?? ''), gold.location),
        `expected ${gold.location}, got ${result.location}`,
        2,
    );
    check(
        'location-not-remote',
        normalizeLocation(String(result.location ?? '')) !== 'remote',
        'location was remote',
        1,
    );

    if (gold.salary) {
        const range = result.salaryRange;
        check(
            'salary.min',
            salaryAmountMatches(range?.min ?? null, gold.salary.min),
            `expected min ${gold.salary.min}, got ${range?.min}`,
            2,
        );
        check(
            'salary.max',
            salaryAmountMatches(range?.max ?? null, gold.salary.max),
            `expected max ${gold.salary.max}, got ${range?.max}`,
            2,
        );
        if (gold.salary.min != null || gold.salary.max != null) {
            check(
                'salary.currency',
                currencyMatches(range?.currency, gold.salary.currency),
                `expected currency ${gold.salary.currency}, got ${range?.currency}`,
                1,
            );
            if (gold.salary.period) {
                check(
                    'salary.period',
                    range?.period === gold.salary.period,
                    `expected period ${gold.salary.period}, got ${range?.period}`,
                    1,
                );
            }
        }
        check(
            'salary.not-zero',
            range?.min !== 0 && range?.max !== 0,
            'salary contained 0',
            1,
        );
    }

    if (gold.requiredStack?.length) {
        const stack = (result.details?.stack ?? []).map((item) =>
            item.toLowerCase(),
        );
        for (const token of gold.requiredStack) {
            check(
                `stack.${token}`,
                stack.some((item) => item.includes(token.toLowerCase())),
                `missing stack token ${token}`,
                1,
            );
        }
    }

    if (gold.requiredTeamSubstring) {
        const team = result.details?.team ?? '';
        check(
            'team',
            team
                .toLowerCase()
                .includes(gold.requiredTeamSubstring.toLowerCase()),
            `expected team to include ${gold.requiredTeamSubstring}, got ${team || '(empty)'}`,
            1,
        );
    }

    if (gold.omitTeam) {
        check(
            'team.omitted',
            !result.details?.team,
            `expected no team, got ${result.details?.team}`,
            1,
        );
    }

    if (gold.forbiddenDetailSubstrings?.length) {
        const text = detailText(result);
        for (const forbidden of gold.forbiddenDetailSubstrings) {
            check(
                `forbidden.${forbidden}`,
                !text.includes(forbidden.toLowerCase()),
                `details contained forbidden text: ${forbidden}`,
                1,
            );
        }
    }

    return {
        fixtureId: fixture.id,
        parsed: true,
        score,
        maxScore,
        failures,
    };
};
