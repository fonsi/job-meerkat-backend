import { parseSocialMediaPosts } from './socialMediaPosts';

describe('parseSocialMediaPosts', () => {
    it('parses bluesky and threads arrays', () => {
        expect(
            parseSocialMediaPosts(
                JSON.stringify({
                    bluesky: ['b1'],
                    threads: ['t1', 't2'],
                }),
            ),
        ).toEqual({
            bluesky: ['b1'],
            threads: ['t1', 't2'],
        });
    });

    it('defaults a missing platform to an empty array', () => {
        expect(
            parseSocialMediaPosts(JSON.stringify({ bluesky: ['b1'] })),
        ).toEqual({
            bluesky: ['b1'],
            threads: [],
        });
    });

    it('wraps a single string post into an array', () => {
        expect(
            parseSocialMediaPosts(
                JSON.stringify({ bluesky: 'b1', threads: ['t1'] }),
            ),
        ).toEqual({
            bluesky: ['b1'],
            threads: ['t1'],
        });
    });

    it('strips trailing dots from URLs', () => {
        expect(
            parseSocialMediaPosts(
                JSON.stringify({
                    bluesky: ['See https://jobmeerkat.com.'],
                    threads: [],
                }),
            ),
        ).toEqual({
            bluesky: ['See https://jobmeerkat.com'],
            threads: [],
        });
    });

    it('throws when the response is empty', () => {
        expect(() => parseSocialMediaPosts(null)).toThrow(
            'OpenAI social posts response was empty',
        );
    });

    it('throws when both platforms are missing', () => {
        expect(() =>
            parseSocialMediaPosts(JSON.stringify({ foo: 'bar' })),
        ).toThrow('OpenAI social posts missing bluesky/threads arrays');
    });
});
