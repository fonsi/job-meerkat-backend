import { readFileSync } from 'fs';
import { join } from 'path';
import { loadResvg } from './resvgBinding';

const WORDMARK_PATH = 'jobmeerkat-logo-text-white.png';

export type BrandAssets = {
    mark: Buffer;
    wordmark: Buffer;
};

const assetsBaseUrl = (): string => {
    const url = process.env.ASSETS_URL;
    if (!url) throw new Error('ASSETS_URL is not set');

    return url;
};

const svgToPng = (svg: string, width: number): Buffer => {
    const Resvg = loadResvg();

    return Buffer.from(
        new Resvg(svg, { fitTo: { mode: 'width', value: width } })
            .render()
            .asPng(),
    );
};

export const loadBrandMark = (): Buffer =>
    svgToPng(
        readFileSync(
            join(
                process.cwd(),
                'src/jobPost/infrastructure/og/brand/meerkat.svg',
            ),
            'utf8',
        ),
        256,
    );

export const loadBrandWordmark = async (): Promise<Buffer> => {
    const response = await fetch(`${assetsBaseUrl()}/${WORDMARK_PATH}`);
    if (!response.ok) {
        throw new Error(`Brand wordmark request failed (${response.status})`);
    }

    return Buffer.from(await response.arrayBuffer());
};

export const loadBrandAssets = async (): Promise<BrandAssets> => {
    const [mark, wordmark] = await Promise.all([
        Promise.resolve(loadBrandMark()),
        loadBrandWordmark(),
    ]);

    return { mark, wordmark };
};
