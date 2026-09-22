import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import satori from 'satori';
import { JobPostOgCard } from './layouts';
import { OG_HEIGHT, OG_WIDTH, OgCardModel } from './ogShared';
import { loadResvg } from './resvgBinding';

const fontsDir = join(process.cwd(), 'src/jobPost/infrastructure/og/fonts');
const interRegular = readFileSync(join(fontsDir, 'Inter-Regular.ttf'));
const interBold = readFileSync(join(fontsDir, 'Inter-Bold.ttf'));

export const renderJobPostOgImage = async (
    card: OgCardModel,
): Promise<Buffer> => {
    const svg = await satori(<JobPostOgCard {...card} />, {
        width: OG_WIDTH,
        height: OG_HEIGHT,
        fonts: [
            {
                name: 'Inter',
                data: interRegular,
                weight: 400,
                style: 'normal',
            },
            {
                name: 'Inter',
                data: interBold,
                weight: 700,
                style: 'normal',
            },
        ],
    });
    const Resvg = loadResvg();
    const png = new Resvg(svg, {
        font: { loadSystemFonts: false },
        fitTo: { mode: 'width', value: OG_WIDTH },
    })
        .render()
        .asPng();

    return Buffer.from(png);
};
