import { parseFollowerGrowthConcept } from './followerGrowthConcept';

const response = {
    family: 'remoteWorkReality',
    readerProblem:
        'A remote listing names a location, and the reader cannot tell whether it is an eligibility rule',
    editorialThesis:
        'Remote describes where work happens, not necessarily where the employee may live',
    readerValue:
        'Readers will know what to verify before deciding they are eligible',
    evidenceRole: 'illustrate',
};

describe('parseFollowerGrowthConcept', () => {
    it('parses a broad editorial concept', () => {
        expect(
            parseFollowerGrowthConcept(
                JSON.stringify(response),
                'remoteWorkReality',
            ),
        ).toEqual(response);
    });

    it('normalizes family labels and enforces a requested family', () => {
        expect(
            parseFollowerGrowthConcept(
                JSON.stringify({
                    ...response,
                    family: 'remote_work_reality',
                }),
            ).family,
        ).toBe('remoteWorkReality');
        expect(() =>
            parseFollowerGrowthConcept(
                JSON.stringify(response),
                'applicationGuidance',
            ),
        ).toThrow('family must be applicationGuidance');
    });

    it('requires complete fields and a supported evidence role', () => {
        expect(() =>
            parseFollowerGrowthConcept(
                JSON.stringify({ ...response, readerProblem: '' }),
            ),
        ).toThrow('readerProblem must be 1-280 characters');
        expect(() =>
            parseFollowerGrowthConcept(
                JSON.stringify({ ...response, evidenceRole: 'prove' }),
            ),
        ).toThrow('evidenceRole was invalid');
    });
});
