import { Workplace } from './jobPost';
import { formatJobPlaceLabel } from './formatJobPlaceLabel';

describe('formatJobPlaceLabel', () => {
    it('joins workplace and location', () => {
        expect(
            formatJobPlaceLabel({
                workplace: Workplace.Remote,
                location: 'United States',
            }),
        ).toBe('Remote — United States');
    });

    it('hides unknown workplace', () => {
        expect(
            formatJobPlaceLabel({
                workplace: Workplace.Unknown,
                location: 'United States',
            }),
        ).toBe('United States');
    });

    it('hides unknown location', () => {
        expect(
            formatJobPlaceLabel({
                workplace: Workplace.Hybrid,
                location: 'unknown',
            }),
        ).toBe('Hybrid');
    });

    it('returns null when both are unknown', () => {
        expect(
            formatJobPlaceLabel({
                workplace: Workplace.Unknown,
                location: 'Unknown',
            }),
        ).toBeNull();
    });

    it('labels on-site workplaces', () => {
        expect(
            formatJobPlaceLabel({
                workplace: Workplace.OnSite,
                location: 'Berlin',
            }),
        ).toBe('On-site — Berlin');
    });

    it('does not repeat Remote — Remote', () => {
        expect(
            formatJobPlaceLabel({
                workplace: Workplace.Remote,
                location: 'Remote',
            }),
        ).toBe('Remote');
    });

    it('drops location when it is only a workplace word', () => {
        expect(
            formatJobPlaceLabel({
                workplace: Workplace.OnSite,
                location: 'Remote',
            }),
        ).toBe('On-site');
    });
});
