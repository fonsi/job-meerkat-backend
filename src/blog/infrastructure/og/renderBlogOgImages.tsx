import React from 'react';
import {
    BlogOgCard,
    BlogPostOgCard,
} from 'jobPost/infrastructure/og/brandCards';
import { renderSatoriPng } from 'jobPost/infrastructure/og/renderSatoriPng';

export const renderGenericBlogOgImage = ({
    mark,
    wordmark,
}: {
    mark: Buffer;
    wordmark: Buffer;
}): Promise<Buffer> =>
    renderSatoriPng(<BlogOgCard mark={mark} wordmark={wordmark} />);

export const renderBlogPostOgImage = ({
    title,
    kicker,
    dateLabel,
    mark,
    wordmark,
}: {
    title: string;
    kicker: string;
    dateLabel: string;
    mark: Buffer;
    wordmark: Buffer;
}): Promise<Buffer> =>
    renderSatoriPng(
        <BlogPostOgCard
            title={title}
            kicker={kicker}
            dateLabel={dateLabel}
            mark={mark}
            wordmark={wordmark}
        />,
    );
