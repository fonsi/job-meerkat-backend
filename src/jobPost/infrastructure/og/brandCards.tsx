import React from 'react';
import { renderWaveBackground } from './waveBackground';
import {
    OG_HEIGHT,
    OG_SAFE_MARGIN,
    OG_SAFE_WIDTH,
    OG_WIDTH,
    fitBox,
    logoDataUrl,
    pngSize,
} from './ogShared';

const LIME = '#D6FF3F';

const frame = (seed: string, children: React.ReactNode) => {
    const waves = logoDataUrl(renderWaveBackground(seed));

    return (
        <div
            style={{
                width: OG_WIDTH,
                height: OG_HEIGHT,
                display: 'flex',
                backgroundColor: '#0C0F0E',
                fontFamily: 'Inter',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <img
                src={waves}
                width={OG_WIDTH}
                height={OG_HEIGHT}
                style={{ position: 'absolute', top: 0, left: 0 }}
            />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: OG_WIDTH,
                    height: OG_HEIGHT,
                    padding: OG_SAFE_MARGIN,
                }}
            >
                {children}
            </div>
        </div>
    );
};

const BrandLockup = ({
    mark,
    wordmark,
}: {
    mark: Buffer;
    wordmark: Buffer;
}) => {
    const markBox = fitBox(pngSize(mark) ?? { width: 96, height: 96 }, 72, 72);
    const wordmarkBox = fitBox(
        pngSize(wordmark) ?? { width: 400, height: 43 },
        340,
        40,
    );

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                width: OG_SAFE_WIDTH,
            }}
        >
            <img
                src={logoDataUrl(mark)}
                width={markBox.width}
                height={markBox.height}
                style={{ objectFit: 'contain' }}
            />
            <img
                src={logoDataUrl(wordmark)}
                width={wordmarkBox.width}
                height={wordmarkBox.height}
                style={{ objectFit: 'contain', marginLeft: 16 }}
            />
        </div>
    );
};

export const CompanyOgCard = ({
    companyName,
    logo,
    mark,
    wordmark,
}: {
    companyName: string;
    logo: Buffer | null;
    mark: Buffer;
    wordmark: Buffer;
}) => {
    const logoBox = logo
        ? fitBox(pngSize(logo) ?? { width: 100, height: 100 }, 84, 84)
        : null;

    return frame(`company:${companyName}`, [
        <BrandLockup mark={mark} wordmark={wordmark} />,
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: OG_SAFE_WIDTH,
                }}
            >
                {logo && logoBox ? (
                    <img
                        src={logoDataUrl(logo)}
                        width={logoBox.width}
                        height={logoBox.height}
                        style={{ objectFit: 'contain' }}
                    />
                ) : null}
                <div
                    style={{
                        display: 'flex',
                        marginLeft: logo ? 20 : 0,
                        fontSize: 84,
                        fontWeight: 700,
                        color: LIME,
                        letterSpacing: '-2px',
                        lineHeight: 1,
                    }}
                >
                    {`Jobs at ${companyName}`}
                </div>
            </div>
        </div>,
    ]);
};

export const SiteOgCard = ({
    mark,
    wordmark,
}: {
    mark: Buffer;
    wordmark: Buffer;
}) =>
    frame('jobmeerkat', [
        <BrandLockup mark={mark} wordmark={wordmark} />,
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    fontSize: 84,
                    fontWeight: 700,
                    color: LIME,
                    letterSpacing: '-2px',
                    lineHeight: 1,
                }}
            >
                Remote jobs
            </div>
            <div
                style={{
                    display: 'flex',
                    width: OG_SAFE_WIDTH,
                    marginTop: 16,
                    fontSize: 40,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: '#F5F7F6',
                    letterSpacing: '-1px',
                }}
            >
                with public salaries
            </div>
            <div
                style={{
                    display: 'flex',
                    marginTop: 16,
                    fontSize: 24,
                    color: '#9AA39C',
                }}
            >
                Tracked daily
            </div>
        </div>,
    ]);

export const BlogOgCard = ({
    mark,
    wordmark,
}: {
    mark: Buffer;
    wordmark: Buffer;
}) =>
    frame('jobmeerkat-blog', [
        <BrandLockup mark={mark} wordmark={wordmark} />,
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    fontSize: 84,
                    fontWeight: 700,
                    color: LIME,
                    letterSpacing: '-2px',
                    lineHeight: 1,
                }}
            >
                Jobmeerkat Blog
            </div>
            <div
                style={{
                    display: 'flex',
                    width: OG_SAFE_WIDTH,
                    marginTop: 16,
                    fontSize: 40,
                    fontWeight: 700,
                    lineHeight: 1.15,
                    color: '#F5F7F6',
                    letterSpacing: '-1px',
                }}
            >
                Remote job market, from live listings
            </div>
        </div>,
    ]);

export const BlogPostOgCard = ({
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
}) =>
    frame(`blog:${title}`, [
        <BrandLockup mark={mark} wordmark={wordmark} />,
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                flexGrow: 1,
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    fontSize: 22,
                    fontWeight: 700,
                    color: LIME,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                }}
            >
                {kicker}
            </div>
            <div
                style={{
                    display: 'flex',
                    width: OG_SAFE_WIDTH,
                    marginTop: 16,
                    fontSize: 52,
                    fontWeight: 700,
                    lineHeight: 1.1,
                    color: '#F5F7F6',
                    letterSpacing: '-1px',
                }}
            >
                {title}
            </div>
            <div
                style={{
                    display: 'flex',
                    marginTop: 20,
                    fontSize: 24,
                    color: '#9AA39C',
                }}
            >
                {dateLabel}
            </div>
        </div>,
    ]);
