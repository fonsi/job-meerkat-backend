import {
    analyzeJobPostWithModel,
    OPENAI_JOB_POST_ANALYZER_BASELINE_MODEL,
    OPENAI_JOB_POST_ANALYZER_MODEL,
} from './openaiJobPostAnalyzer';
import {
    AnalyzerFixtureScore,
    openaiJobPostAnalyzerEvalFixtures,
    scoreAnalyzerResult,
} from './openaiJobPostAnalyzer.eval.fixtures';

const runEval =
    process.env.RUN_OPENAI_EVAL === '1' && Boolean(process.env.OPENAI_API_KEY);

const formatScorecard = (
    model: string,
    scores: AnalyzerFixtureScore[],
): string => {
    const totalScore = scores.reduce((sum, item) => sum + item.score, 0);
    const totalMax = scores.reduce((sum, item) => sum + item.maxScore, 0);
    const lines = scores.map((item) => {
        const failureSummary = item.failures
            .map(
                (failure) =>
                    `${failure.field}${failure.detail ? `: ${failure.detail}` : ''}`,
            )
            .join('; ');
        return `  ${item.fixtureId}: ${item.score}/${item.maxScore}${failureSummary ? ` — ${failureSummary}` : ''}`;
    });

    return [`${model}: ${totalScore}/${totalMax}`, ...lines].join('\n');
};

const scoreModel = async (model: string): Promise<AnalyzerFixtureScore[]> => {
    const scores: AnalyzerFixtureScore[] = [];
    for (const fixture of openaiJobPostAnalyzerEvalFixtures) {
        try {
            const result = await analyzeJobPostWithModel(
                fixture.content,
                model,
            );
            scores.push(scoreAnalyzerResult(fixture, result));
        } catch (error) {
            scores.push(
                scoreAnalyzerResult(
                    fixture,
                    null,
                    error instanceof Error ? error.message : String(error),
                ),
            );
        }
    }

    return scores;
};

(runEval ? describe : describe.skip)(
    'openaiJobPostAnalyzer model quality (live OpenAI)',
    () => {
        jest.setTimeout(300_000);

        it('keeps or improves quality vs gpt-4o-mini on gold fixtures', async () => {
            const [miniScores, lunaScores] = await Promise.all([
                scoreModel(OPENAI_JOB_POST_ANALYZER_BASELINE_MODEL),
                scoreModel(OPENAI_JOB_POST_ANALYZER_MODEL),
            ]);

            const miniTotal = miniScores.reduce(
                (sum, item) => sum + item.score,
                0,
            );
            const lunaTotal = lunaScores.reduce(
                (sum, item) => sum + item.score,
                0,
            );
            const lunaParseRate =
                lunaScores.filter((item) => item.parsed).length /
                lunaScores.length;

            console.log(
                [
                    'Job post analyzer quality eval',
                    formatScorecard(
                        OPENAI_JOB_POST_ANALYZER_BASELINE_MODEL,
                        miniScores,
                    ),
                    formatScorecard(OPENAI_JOB_POST_ANALYZER_MODEL, lunaScores),
                ].join('\n'),
            );

            expect(lunaParseRate).toBe(1);
            expect(lunaTotal).toBeGreaterThanOrEqual(miniTotal);
        });
    },
);
