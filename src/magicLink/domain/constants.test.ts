import { magicLinkTtlMs } from './constants';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('magicLinkTtlMs', () => {
    it('keeps newsletter confirm links valid for 7 days', () => {
        expect(magicLinkTtlMs('newsletter_confirm')).toBe(7 * DAY_MS);
    });

    it('keeps preferences links short-lived', () => {
        expect(magicLinkTtlMs('newsletter_preferences')).toBe(
            2 * 60 * 60 * 1000,
        );
    });
});
