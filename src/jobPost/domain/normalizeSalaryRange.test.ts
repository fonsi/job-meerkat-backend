import { Period, normalizeSalaryRange } from 'jobPost/domain/jobPost';

describe('normalizeSalaryRange', () => {
    it('returns null when period is empty', () => {
        expect(
            normalizeSalaryRange({
                currency: 'usd',
                period: '' as Period,
                min: 100000,
                max: 150000,
            }),
        ).toBeNull();
    });

    it('returns null when currency is missing', () => {
        expect(
            normalizeSalaryRange({
                currency: '  ',
                period: Period.Year,
                max: 150000,
            }),
        ).toBeNull();
    });

    it('keeps a complete salary range', () => {
        expect(
            normalizeSalaryRange({
                currency: ' usd ',
                period: Period.Year,
                min: 100000,
                max: 150000,
            }),
        ).toEqual({
            currency: 'usd',
            period: Period.Year,
            min: 100000,
            max: 150000,
        });
    });
});
