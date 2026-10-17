import { getAshbyJobPostContent } from 'company/infrastructure/scrapping/ashbyGraphQLRequest';
import { fromURL } from 'company/infrastructure/scrapping/fromUrl';
import {
    analyzeJobPostWithModel,
    OPENAI_JOB_POST_ANALYZER_BASELINE_MODEL,
    OPENAI_JOB_POST_ANALYZER_MODEL,
} from './openaiJobPostAnalyzer';
import { OpenaiJobPost } from './parseOpenaiJobPost';

export type ScrapedAnalyzerSample = {
    source: string;
    jobId: string;
    title: string;
    url: string;
    content: string;
};

export type ScrapeModelPair = {
    sample: ScrapedAnalyzerSample;
    mini: OpenaiJobPost | null;
    luna: OpenaiJobPost | null;
    miniError?: string;
    lunaError?: string;
    agreements: string[];
    disagreements: string[];
};

type ListedJob = {
    id: string;
    title: string;
    url: string;
};

const JOBS_PER_SOURCE = 2;

const listAshbyJobs = async (
    board: string,
    boardUrl: string,
): Promise<ListedJob[]> => {
    const response = await fetch(boardUrl);
    if (!response.ok) {
        throw new Error(`Ashby list failed for ${board}: ${response.status}`);
    }
    const jobsData = (await response.json()) as {
        jobs?: Array<{
            id: string;
            title: string;
            jobUrl: string;
            isListed?: boolean;
            publishedAt?: string;
        }>;
    };

    return (jobsData.jobs ?? [])
        .filter((job) => job.isListed !== false)
        .filter((job) => {
            const title = job.title.toLowerCase();
            return (
                !title.includes('talent pool') &&
                !title.includes('general application') &&
                !title.includes('open application')
            );
        })
        .map((job) => ({
            id: job.id,
            title: job.title,
            url: job.jobUrl,
        }));
};

const fetchAshbySamples = async (
    source: string,
    board: string,
    boardUrl: string,
    limit: number,
): Promise<ScrapedAnalyzerSample[]> => {
    const listed = (await listAshbyJobs(board, boardUrl)).slice(0, limit);
    const samples: ScrapedAnalyzerSample[] = [];

    for (const job of listed) {
        const jobsData = await getAshbyJobPostContent({
            companyName: board,
            jobPostId: job.id,
        });
        samples.push({
            source,
            jobId: job.id,
            title: job.title,
            url: job.url,
            content: JSON.stringify(jobsData),
        });
    }

    return samples;
};

const fetchGreenhouseHtmlSamples = async (
    source: string,
    boardApiUrl: string,
    limit: number,
): Promise<ScrapedAnalyzerSample[]> => {
    const response = await fetch(boardApiUrl);
    if (!response.ok) {
        throw new Error(
            `Greenhouse list failed for ${source}: ${response.status}`,
        );
    }
    const jobsData = (await response.json()) as {
        jobs?: Array<{
            id: number | string;
            title: string;
            absolute_url: string;
        }>;
    };
    const listed = (jobsData.jobs ?? [])
        .filter((job) => {
            const title = job.title.toLowerCase();
            return (
                !title.includes('intern') &&
                !title.includes('general application') &&
                !title.includes('open application')
            );
        })
        .slice(0, limit);

    const samples: ScrapedAnalyzerSample[] = [];
    for (const job of listed) {
        const $ = await fromURL(job.absolute_url);
        const header = $('.job__header').text();
        const description = $('.job__description').text();
        const content = `${header} ${description}`.trim();
        if (!content) continue;

        samples.push({
            source,
            jobId: String(job.id),
            title: job.title,
            url: job.absolute_url,
            content,
        });
    }

    return samples;
};

export const collectLiveScrapeSamples = async (
    jobsPerSource = JOBS_PER_SOURCE,
): Promise<ScrapedAnalyzerSample[]> => {
    const [n8n, attio, figma] = await Promise.all([
        fetchAshbySamples(
            'n8n',
            'n8n',
            'https://api.ashbyhq.com/posting-api/job-board/n8n',
            jobsPerSource,
        ),
        fetchAshbySamples(
            'attio',
            'attio',
            'https://api.ashbyhq.com/posting-api/job-board/attio',
            jobsPerSource,
        ),
        fetchGreenhouseHtmlSamples(
            'figma',
            'https://boards-api.greenhouse.io/v1/boards/figma/jobs?content=true',
            jobsPerSource,
        ),
    ]);

    return [...n8n, ...attio, ...figma];
};

const normalize = (value: unknown): string =>
    String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');

const salaryKey = (job: OpenaiJobPost | null): string => {
    if (!job?.salaryRange) return 'none';
    const { min, max, currency, period } = job.salaryRange;
    return `${min ?? 'null'}|${max ?? 'null'}|${normalize(currency)}|${normalize(period)}`;
};

const comparePair = (
    sample: ScrapedAnalyzerSample,
    mini: OpenaiJobPost | null,
    luna: OpenaiJobPost | null,
    miniError?: string,
    lunaError?: string,
): ScrapeModelPair => {
    const agreements: string[] = [];
    const disagreements: string[] = [];

    const check = (
        field: string,
        left: unknown,
        right: unknown,
        serialize: (value: unknown) => string = normalize,
    ): void => {
        const a = serialize(left);
        const b = serialize(right);
        if (a === b) agreements.push(field);
        else
            disagreements.push(
                `${field}: mini=${JSON.stringify(left)} luna=${JSON.stringify(right)}`,
            );
    };

    if (!mini || !luna) {
        if (!mini) disagreements.push(`mini.parse: ${miniError ?? 'missing'}`);
        if (!luna) disagreements.push(`luna.parse: ${lunaError ?? 'missing'}`);
        return {
            sample,
            mini,
            luna,
            miniError,
            lunaError,
            agreements,
            disagreements,
        };
    }

    check('category', mini.category, luna.category);
    check('type', mini.type, luna.type);
    check('workplace', mini.workplace, luna.workplace);
    check(
        'location',
        Array.isArray(mini.location) ? mini.location.join(', ') : mini.location,
        Array.isArray(luna.location) ? luna.location.join(', ') : luna.location,
    );
    const miniSalary = salaryKey(mini);
    const lunaSalary = salaryKey(luna);
    if (miniSalary === lunaSalary) agreements.push('salary');
    else disagreements.push(`salary: mini=${miniSalary} luna=${lunaSalary}`);

    const locationIsRemote =
        normalize(luna.location) === 'remote' ||
        normalize(mini.location) === 'remote';
    if (locationIsRemote) {
        disagreements.push('location-literal-remote');
    } else {
        agreements.push('location-not-remote');
    }

    const zeroSalary =
        luna.salaryRange?.min === 0 ||
        luna.salaryRange?.max === 0 ||
        mini.salaryRange?.min === 0 ||
        mini.salaryRange?.max === 0;
    if (zeroSalary) disagreements.push('salary-zero');
    else agreements.push('salary-not-zero');

    return {
        sample,
        mini,
        luna,
        miniError,
        lunaError,
        agreements,
        disagreements,
    };
};

export const analyzeScrapeSamplesWithBothModels = async (
    samples: ScrapedAnalyzerSample[],
): Promise<ScrapeModelPair[]> => {
    const pairs: ScrapeModelPair[] = [];

    for (const sample of samples) {
        let mini: OpenaiJobPost | null = null;
        let luna: OpenaiJobPost | null = null;
        let miniError: string | undefined;
        let lunaError: string | undefined;

        try {
            mini = await analyzeJobPostWithModel(
                sample.content,
                OPENAI_JOB_POST_ANALYZER_BASELINE_MODEL,
            );
        } catch (error) {
            miniError = error instanceof Error ? error.message : String(error);
        }

        try {
            luna = await analyzeJobPostWithModel(
                sample.content,
                OPENAI_JOB_POST_ANALYZER_MODEL,
            );
        } catch (error) {
            lunaError = error instanceof Error ? error.message : String(error);
        }

        pairs.push(comparePair(sample, mini, luna, miniError, lunaError));
    }

    return pairs;
};

export const summarizeScrapeEval = (pairs: ScrapeModelPair[]): string => {
    const lunaParsed = pairs.filter((pair) => pair.luna).length;
    const hardFields = [
        'category',
        'type',
        'workplace',
        'location',
        'salary',
    ] as const;
    let agreed = 0;
    let compared = 0;

    const lines = pairs.map((pair) => {
        const label = `${pair.sample.source} / ${pair.sample.title}`;
        if (!pair.mini || !pair.luna) {
            return `  FAIL ${label}\n    ${pair.disagreements.join('; ')}`;
        }
        for (const field of hardFields) {
            compared += 1;
            if (pair.agreements.includes(field)) agreed += 1;
        }
        const diffs = pair.disagreements.filter((item) =>
            hardFields.some((field) => item.startsWith(`${field}:`)),
        );
        return diffs.length
            ? `  DIFF ${label}\n    ${diffs.join('\n    ')}`
            : `  OK   ${label}`;
    });

    const agreementRate = compared === 0 ? 0 : agreed / compared;

    return [
        `Live scrape analyzer compare (${pairs.length} jobs)`,
        `Luna parse success: ${lunaParsed}/${pairs.length}`,
        `Hard-field agreement vs mini: ${agreed}/${compared} (${(agreementRate * 100).toFixed(1)}%)`,
        ...lines,
    ].join('\n');
};

export const scrapeEvalAgreementRate = (pairs: ScrapeModelPair[]): number => {
    const hardFields = ['category', 'type', 'workplace', 'location', 'salary'];
    let agreed = 0;
    let compared = 0;
    for (const pair of pairs) {
        if (!pair.mini || !pair.luna) continue;
        for (const field of hardFields) {
            compared += 1;
            if (pair.agreements.includes(field)) agreed += 1;
        }
    }
    return compared === 0 ? 0 : agreed / compared;
};
