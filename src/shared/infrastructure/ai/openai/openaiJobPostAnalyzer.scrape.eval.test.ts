import {
    analyzeScrapeSamplesWithBothModels,
    collectLiveScrapeSamples,
    scrapeEvalAgreementRate,
    summarizeScrapeEval,
} from './openaiJobPostAnalyzer.scrapeEval';

const runEval =
    process.env.RUN_OPENAI_EVAL === '1' && Boolean(process.env.OPENAI_API_KEY);

(runEval ? describe : describe.skip)(
    'openaiJobPostAnalyzer live scrape quality (Ashby + Greenhouse)',
    () => {
        jest.setTimeout(600_000);

        it('keeps high agreement with gpt-4o-mini on real scraped job posts', async () => {
            const samples = await collectLiveScrapeSamples(2);
            expect(samples.length).toBeGreaterThanOrEqual(4);

            const pairs = await analyzeScrapeSamplesWithBothModels(samples);
            const lunaParseRate =
                pairs.filter((pair) => pair.luna).length / pairs.length;
            const agreementRate = scrapeEvalAgreementRate(pairs);

            console.log(summarizeScrapeEval(pairs));

            expect(lunaParseRate).toBe(1);
            expect(agreementRate).toBeGreaterThanOrEqual(0.85);
            expect(
                pairs.every(
                    (pair) =>
                        !pair.disagreements.includes(
                            'location-literal-remote',
                        ) && !pair.disagreements.includes('salary-zero'),
                ),
            ).toBe(true);
        });
    },
);
