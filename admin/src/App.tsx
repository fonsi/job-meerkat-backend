import { useCallback, useEffect, useState } from 'react';

type SalaryRange = {
    min?: number;
    max?: number;
    currency: string;
    period: string;
};

type SampleJob = {
    title: string;
    category: string;
    workplace: string;
    location: string;
    salaryRange: SalaryRange | null;
    url: string;
};

type SampleJobs = {
    listedCount: number;
    listedTitles: string[];
    sampledAt: string;
    sampleSize: number;
    jobs: SampleJob[];
};

type PendingCompany = {
    id: string;
    name: string;
    homePage: string;
    description?: string;
    hasLogo: boolean;
    hasOg: boolean;
    sampleJobs: SampleJobs | null;
};

type BusyAction = 'generate' | 'replace' | 'generate-og' | 'promote' | null;

const formatSalary = (range: SalaryRange | null): string => {
    if (!range) return 'no salary';
    const min = range.min != null ? range.min.toLocaleString() : '';
    const max = range.max != null ? range.max.toLocaleString() : '';
    const span = min && max ? `${min}–${max}` : min || max;
    if (!span) return 'no salary';

    return `${range.currency} ${span} / ${range.period}`;
};

const formatWorkplace = (workplace: string): string => {
    if (workplace === 'onSite') return 'on-site';

    return workplace;
};

export const App = () => {
    const [companies, setCompanies] = useState<PendingCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [busyAction, setBusyAction] = useState<BusyAction>(null);
    const [assetVersion, setAssetVersion] = useState<Record<string, number>>(
        {},
    );

    const load = useCallback(async () => {
        setError(null);
        const response = await fetch('/api/pending');
        const body = await response.json();
        if (!response.ok) {
            throw new Error(body.error || 'Failed to load pending companies');
        }
        setCompanies(body.companies as PendingCompany[]);
    }, []);

    useEffect(() => {
        load()
            .catch((err: Error) => setError(err.message))
            .finally(() => setLoading(false));
    }, [load]);

    const runAction = async (
        companyId: string,
        action: Exclude<BusyAction, null>,
        fn: () => Promise<void>,
    ): Promise<void> => {
        setBusyId(companyId);
        setBusyAction(action);
        setError(null);
        try {
            await fn();
            await load();
            if (action !== 'promote') {
                setAssetVersion((current) => ({
                    ...current,
                    [companyId]: Date.now(),
                }));
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setBusyId(null);
            setBusyAction(null);
        }
    };

    const generateLogo = (companyId: string) =>
        runAction(companyId, 'generate', async () => {
            const response = await fetch(
                `/api/pending/${companyId}/generate-logo`,
                { method: 'POST' },
            );
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'Generate failed');
        });

    const generateOg = (companyId: string) =>
        runAction(companyId, 'generate-og', async () => {
            const response = await fetch(
                `/api/pending/${companyId}/generate-og`,
                { method: 'POST' },
            );
            const body = await response.json();
            if (!response.ok)
                throw new Error(body.error || 'OG generate failed');
        });

    const replaceLogo = (companyId: string, file: File) =>
        runAction(companyId, 'replace', async () => {
            const response = await fetch(`/api/pending/${companyId}/logo`, {
                method: 'POST',
                headers: {
                    'Content-Type': file.type || 'application/octet-stream',
                },
                body: file,
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'Upload failed');
        });

    const promote = (company: PendingCompany) => {
        if (
            !window.confirm(
                `Add ${company.name} to production and upload logo.png + og.png to S3? Scrapers must already be deployed to prod.`,
            )
        ) {
            return;
        }

        return runAction(company.id, 'promote', async () => {
            const response = await fetch(`/api/pending/${company.id}/promote`, {
                method: 'POST',
            });
            const body = await response.json();
            if (!response.ok) throw new Error(body.error || 'Promote failed');
        });
    };

    return (
        <>
            <h1>Pending companies</h1>
            <p className="lede">
                In dev, not in production. Review sample jobs, logo, and OG
                image, then Add.
            </p>
            {loading ? <p className="status">Loading…</p> : null}
            {error ? <p className="error">{error}</p> : null}
            {!loading && companies.length === 0 ? (
                <p className="empty">No pending companies.</p>
            ) : null}
            {companies.map((company) => {
                const busy = busyId === company.id;
                const version = assetVersion[company.id] || 0;
                const canAdd = company.hasLogo && company.hasOg;

                return (
                    <article className="card" key={company.id}>
                        <div className="card-header">
                            <div className="logo-box">
                                {company.hasLogo ? (
                                    <img
                                        alt={`${company.name} logo`}
                                        src={`/api/pending/${company.id}/logo?v=${version}`}
                                    />
                                ) : (
                                    <span className="logo-missing">
                                        no logo
                                    </span>
                                )}
                            </div>
                            <div className="meta">
                                <h2>{company.name}</h2>
                                <a
                                    href={company.homePage}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    {company.homePage}
                                </a>
                                {company.description ? (
                                    <p>{company.description}</p>
                                ) : null}
                            </div>
                        </div>
                        <div className="og-preview">
                            <h3>OG image</h3>
                            {company.hasOg ? (
                                <img
                                    alt={`${company.name} Open Graph`}
                                    className="og-image"
                                    src={`/api/pending/${company.id}/og?v=${version}`}
                                />
                            ) : (
                                <p className="empty">
                                    No OG yet. Generate or replace the logo
                                    first.
                                </p>
                            )}
                        </div>
                        <div className="actions">
                            <button
                                disabled={busy}
                                onClick={() => generateLogo(company.id)}
                                type="button"
                            >
                                {busy && busyAction === 'generate'
                                    ? 'Generating…'
                                    : 'Regenerate logo'}
                            </button>
                            <label className="file-btn">
                                Replace logo
                                <input
                                    accept="image/*,.svg"
                                    disabled={busy}
                                    onChange={(event) => {
                                        const file = event.target.files?.[0];
                                        event.target.value = '';
                                        if (file) replaceLogo(company.id, file);
                                    }}
                                    type="file"
                                />
                            </label>
                            <button
                                disabled={busy || !company.hasLogo}
                                onClick={() => generateOg(company.id)}
                                type="button"
                            >
                                {busy && busyAction === 'generate-og'
                                    ? 'Generating OG…'
                                    : 'Regenerate OG'}
                            </button>
                            <button
                                className="primary"
                                disabled={busy || !canAdd}
                                onClick={() => promote(company)}
                                type="button"
                            >
                                {busy && busyAction === 'promote'
                                    ? 'Adding…'
                                    : 'Add'}
                            </button>
                        </div>
                        <div className="jobs">
                            <h3>
                                Sample jobs
                                {company.sampleJobs
                                    ? ` (${company.sampleJobs.sampleSize} of ${company.sampleJobs.listedCount})`
                                    : ''}
                            </h3>
                            {company.sampleJobs?.jobs.length ? (
                                <ul>
                                    {company.sampleJobs.jobs.map((job) => (
                                        <li key={job.url}>
                                            <a
                                                href={job.url}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {job.title}
                                            </a>
                                            <div className="job-meta">
                                                {[
                                                    job.category,
                                                    formatWorkplace(
                                                        job.workplace,
                                                    ),
                                                    job.location,
                                                    formatSalary(
                                                        job.salaryRange,
                                                    ),
                                                ]
                                                    .filter(Boolean)
                                                    .join(' · ')}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="empty">
                                    No sample scrape yet. Run{' '}
                                    <code>npm run scrap-company</code> with this
                                    company id.
                                </p>
                            )}
                        </div>
                    </article>
                );
            })}
        </>
    );
};
