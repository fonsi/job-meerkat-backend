import React from 'react';
import {
    OG_HEIGHT,
    OG_SAFE_MARGIN,
    OG_SAFE_WIDTH,
    OG_WIDTH,
    OgCardModel,
    logoDataUrl,
    pngSize,
} from './ogShared';
import { renderWaveBackground } from './waveBackground';

const LIME = '#D6FF3F';
const LIME_PILL = '#243008';
const BRAND_WORDMARK = { width: 186, height: 20 };
const DETAIL_LINE_LIMIT = 68;

const frame = (children: React.ReactNode) => (
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
        {children}
    </div>
);

const nativeLogoBox = (logo: Buffer) => {
    const size = pngSize(logo) ?? { width: 100, height: 24 };
    const width = Math.min(size.width, 100);
    const height = Math.max(1, Math.round((size.height * width) / size.width));

    return { width, height };
};

const splitDetail = (meta: string | null) => {
    if (!meta) return { line: null, extra: null };
    const separator = ' — ';
    const splitAt = meta.indexOf(separator);
    if (splitAt === -1 || meta.length <= DETAIL_LINE_LIMIT)
        return { line: meta, extra: null };

    return {
        line: meta.slice(0, splitAt),
        extra: meta.slice(splitAt + separator.length),
    };
};

const CategoryPill = ({ category }: { category: string }) => (
    <div
        style={{
            display: 'flex',
            alignSelf: 'flex-start',
            backgroundColor: LIME_PILL,
            color: LIME,
            fontSize: 20,
            fontWeight: 700,
            padding: '8px 16px',
            borderRadius: 999,
        }}
    >
        {category}
    </div>
);

const SalaryFigure = ({
    amount,
    caption,
}: {
    amount: string;
    caption: string | null;
}) => (
    <div
        style={{
            display: 'flex',
            flexDirection: 'column',
            width: OG_SAFE_WIDTH,
        }}
    >
        <div
            style={{
                display: 'flex',
                fontSize: 92,
                fontWeight: 700,
                color: LIME,
                letterSpacing: '-2px',
                lineHeight: 1,
            }}
        >
            {amount}
        </div>
        {caption ? (
            <div
                style={{
                    display: 'flex',
                    marginTop: 12,
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#8F9B96',
                }}
            >
                {caption}
            </div>
        ) : null}
    </div>
);

export const JobPostOgCard = (card: OgCardModel) => {
    const logo = card.logo;
    const companyLogo = logo ? nativeLogoBox(logo) : null;
    const brand = card.brandLogo;
    const detail = splitDetail(card.meta);
    const waves = logoDataUrl(
        renderWaveBackground(`${card.companyName}:${card.title}`),
    );

    return frame([
        <img
            src={waves}
            width={OG_WIDTH}
            height={OG_HEIGHT}
            style={{ position: 'absolute', top: 0, left: 0 }}
        />,
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                width: OG_WIDTH,
                height: OG_HEIGHT,
                padding: OG_SAFE_MARGIN,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    width: OG_SAFE_WIDTH,
                }}
            >
                {companyLogo ? (
                    <img
                        src={logoDataUrl(logo)}
                        width={companyLogo.width}
                        height={companyLogo.height}
                        style={{ objectFit: 'contain' }}
                    />
                ) : (
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 28,
                            fontWeight: 700,
                            color: '#F5F7F6',
                        }}
                    >
                        {card.companyName}
                    </div>
                )}
                {brand ? (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                marginRight: 12,
                                fontSize: 18,
                                color: '#9AA39C',
                            }}
                        >
                            listed at
                        </div>
                        <img
                            src={logoDataUrl(brand)}
                            width={BRAND_WORDMARK.width}
                            height={BRAND_WORDMARK.height}
                            style={{ objectFit: 'contain' }}
                        />
                    </div>
                ) : null}
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flexGrow: 1,
                    justifyContent: 'center',
                }}
            >
                {card.salaryAmount ? (
                    <SalaryFigure
                        amount={card.salaryAmount}
                        caption={card.salaryCaption}
                    />
                ) : null}
                <div
                    style={{
                        display: 'flex',
                        width: OG_SAFE_WIDTH,
                        marginTop: card.salaryAmount ? 28 : 0,
                        fontSize: 40,
                        fontWeight: 700,
                        lineHeight: 1.15,
                        color: '#F5F7F6',
                        letterSpacing: '-1px',
                    }}
                >
                    {card.title}
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'baseline',
                        marginTop: 10,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            fontSize: 24,
                            color: '#9AA39C',
                        }}
                    >
                        at
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            marginLeft: 8,
                            fontSize: 24,
                            fontWeight: 700,
                            color: '#F5F7F6',
                        }}
                    >
                        {card.companyName}
                    </div>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: OG_SAFE_WIDTH,
                        marginTop: 16,
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <CategoryPill category={card.category} />
                        {detail.line ? (
                            <div
                                style={{
                                    display: 'flex',
                                    marginLeft: 14,
                                    fontSize: 24,
                                    color: '#9AA39C',
                                }}
                            >
                                {detail.line}
                            </div>
                        ) : null}
                    </div>
                    {detail.extra ? (
                        <div
                            style={{
                                display: 'flex',
                                width: OG_SAFE_WIDTH,
                                marginTop: 8,
                                fontSize: 24,
                                lineHeight: 1.3,
                                color: '#9AA39C',
                            }}
                        >
                            {detail.extra}
                        </div>
                    ) : null}
                </div>
            </div>
        </div>,
    ]);
};
