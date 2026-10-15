import sharp from 'sharp';
import { LOGO_WIDTH_PX } from 'company/infrastructure/admin/constants';

export type ProcessLogoOptions = {
    forceWhite: boolean;
    width?: number;
};

const LIGHT_PIXEL_THRESHOLD = 240;
const OPAQUE_ALPHA_THRESHOLD = 16;
const MOSTLY_OPAQUE_RATIO = 0.95;

const isSvg = (input: Buffer): boolean => {
    const head = input.subarray(0, 256).toString('utf8').toLowerCase();

    return head.includes('<svg') || head.includes('<?xml');
};

const toRgba = async (input: Buffer) => {
    const pipeline = isSvg(input)
        ? sharp(input, { density: 300 })
        : sharp(input);

    return pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
};

const pixelCount = (info: sharp.OutputInfo): number => info.width * info.height;

const isMostlyOpaque = (data: Buffer, info: sharp.OutputInfo): boolean => {
    let transparent = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < OPAQUE_ALPHA_THRESHOLD) transparent++;
    }

    return 1 - transparent / pixelCount(info) >= MOSTLY_OPAQUE_RATIO;
};

const knockOutLightBackground = (data: Buffer): void => {
    for (let i = 0; i < data.length; i += 4) {
        if (
            data[i] > LIGHT_PIXEL_THRESHOLD &&
            data[i + 1] > LIGHT_PIXEL_THRESHOLD &&
            data[i + 2] > LIGHT_PIXEL_THRESHOLD
        ) {
            data[i + 3] = 0;
        }
    }
};

const forcePixelsWhite = (data: Buffer): void => {
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] >= OPAQUE_ALPHA_THRESHOLD) {
            data[i] = 255;
            data[i + 1] = 255;
            data[i + 2] = 255;
        }
    }
};

const hasVisiblePixels = (data: Buffer): boolean => {
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] >= OPAQUE_ALPHA_THRESHOLD) return true;
    }

    return false;
};

export const processLogoBuffer = async (
    input: Buffer,
    { forceWhite, width = LOGO_WIDTH_PX }: ProcessLogoOptions,
): Promise<Buffer> => {
    const raw = await toRgba(input);
    const data = Buffer.from(raw.data);

    if (isMostlyOpaque(data, raw.info)) {
        knockOutLightBackground(data);
        if (!hasVisiblePixels(data)) {
            raw.data.copy(data);
        }
    }

    if (forceWhite) forcePixelsWhite(data);

    let image = sharp(data, {
        raw: {
            width: raw.info.width,
            height: raw.info.height,
            channels: 4,
        },
    });

    try {
        image = image.trim({ threshold: 10 });
    } catch {
        // trim throws when the image would be empty; keep original bounds
    }

    return image
        .resize({
            width,
            fit: 'inside',
            withoutEnlargement: false,
        })
        .png()
        .toBuffer();
};
