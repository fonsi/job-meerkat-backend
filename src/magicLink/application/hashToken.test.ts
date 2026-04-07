import { hashMagicLinkToken } from './hashToken';

describe('hashMagicLinkToken', () => {
    const prev = process.env.MAGIC_LINK_PEPPER;

    afterEach(() => {
        process.env.MAGIC_LINK_PEPPER = prev;
    });

    it('is deterministic for same pepper and token', () => {
        process.env.MAGIC_LINK_PEPPER = 'test-pepper';
        expect(hashMagicLinkToken('abc')).toBe(hashMagicLinkToken('abc'));
    });

    it('differs when token differs', () => {
        process.env.MAGIC_LINK_PEPPER = 'test-pepper';
        expect(hashMagicLinkToken('a')).not.toBe(hashMagicLinkToken('b'));
    });
});
