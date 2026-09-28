import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import satori from 'satori';
import { OG_HEIGHT, OG_WIDTH } from './ogShared';
import { loadResvg } from './resvgBinding';

const fontsDir = join(process.cwd(), 'src/jobPost/infrastructure/og/fonts');
const interRegular = readFileSync(join(fontsDir, 'Inter-Regular.ttf'));
const interBold = readFileSync(join(fontsDir, 'Inter-Bold.ttf'));

export const renderSatoriPng = async (
    node: React.ReactNode,
): Promise<Buffer> => {
    const svg = await satori(node, {
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

    return Buffer.from(
        new Resvg(svg, {
            font: { loadSystemFonts: false },
            fitTo: { mode: 'width', value: OG_WIDTH },
        })
            .render()
            .asPng(),
    );
};
