import {
    BLUESKY_MAX_GRAPHEMES,
    THREADS_MAX_CHARACTERS,
} from 'social/domain/socialPostLimits';

const graphemesOf = (text: string): string[] =>
    Array.from(
        new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
            text,
        ),
        (part) => part.segment,
    );

const isCompleteUrl = (value: string): boolean => {
    try {
        return new URL(value).hostname.includes('.');
    } catch {
        return false;
    }
};

const dropIncompleteTrailingUrl = (text: string): string => {
    const trimmed = text.trimEnd();
    const match = /https?:\/\/\S*$/.exec(trimmed);
    if (!match || isCompleteUrl(match[0])) return trimmed;

    return trimmed.slice(0, match.index).trimEnd();
};

export const graphemeCount = (text: string): number => graphemesOf(text).length;

export const truncateToGraphemes = (text: string, max: number): string => {
    const graphemes = graphemesOf(text);
    if (graphemes.length <= max) return text;

    return dropIncompleteTrailingUrl(graphemes.slice(0, max).join(''));
};

export const truncateToCodePoints = (text: string, max: number): string => {
    const chars = [...text];
    if (chars.length <= max) return text;

    return dropIncompleteTrailingUrl(chars.slice(0, max).join(''));
};

export const fitBlueskyPost = (text: string): string =>
    truncateToGraphemes(text, BLUESKY_MAX_GRAPHEMES);

export const fitThreadsPost = (text: string): string =>
    truncateToCodePoints(text, THREADS_MAX_CHARACTERS);
