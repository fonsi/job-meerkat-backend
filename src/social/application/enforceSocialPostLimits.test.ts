import {
    BLUESKY_MAX_GRAPHEMES,
    THREADS_MAX_CHARACTERS,
} from 'social/domain/socialPostLimits';
import {
    fitBlueskyPost,
    fitThreadsPost,
    graphemeCount,
    truncateToCodePoints,
    truncateToGraphemes,
} from './enforceSocialPostLimits';

describe('truncateToGraphemes', () => {
    it('returns text within the limit unchanged', () => {
        expect(truncateToGraphemes('hello', 10)).toBe('hello');
    });

    it('cuts to the grapheme limit', () => {
        expect(truncateToGraphemes('abcdefghij', 4)).toBe('abcd');
        expect(graphemeCount(truncateToGraphemes('a'.repeat(310), 300))).toBe(
            BLUESKY_MAX_GRAPHEMES,
        );
    });

    it('counts a combined emoji as one grapheme', () => {
        const family = '👨‍👩‍👧‍👦';
        expect(graphemeCount(family)).toBe(1);
        expect(truncateToGraphemes(`${family}abc`, 2)).toBe(`${family}a`);
    });

    it('drops a trailing URL that was cut mid-string', () => {
        expect(
            truncateToGraphemes('See https://jobmeerkat.com/jobpost/long', 16),
        ).toBe('See');
    });
});

describe('truncateToCodePoints', () => {
    it('returns text within the limit unchanged', () => {
        expect(truncateToCodePoints('hello', 10)).toBe('hello');
    });

    it('cuts to the character limit', () => {
        expect(truncateToCodePoints('a'.repeat(520), 500)).toHaveLength(
            THREADS_MAX_CHARACTERS,
        );
    });

    it('drops a trailing URL that was cut mid-string', () => {
        expect(
            truncateToCodePoints('Look https://jobmeerkat.com/company/abc', 18),
        ).toBe('Look');
    });
});

describe('fit platform posts', () => {
    it('caps Bluesky copy at 300 graphemes', () => {
        const fitted = fitBlueskyPost('b'.repeat(306));
        expect(graphemeCount(fitted)).toBe(BLUESKY_MAX_GRAPHEMES);
    });

    it('caps Threads copy at 500 characters', () => {
        expect(fitThreadsPost('t'.repeat(512))).toHaveLength(
            THREADS_MAX_CHARACTERS,
        );
    });
});
