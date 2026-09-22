export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
/** 60px inset on every side, inside the central 1080×566 area. */
export const OG_SAFE_MARGIN = 60;
export const OG_SAFE_WIDTH = OG_WIDTH - OG_SAFE_MARGIN * 2;

export type OgCardModel = {
    companyName: string;
    category: string;
    title: string;
    meta: string | null;
    salaryAmount: string | null;
    salaryCaption: string | null;
    logo: Buffer | null;
    brandLogo: Buffer | null;
};

export const pngSize = (
    png: Buffer,
): { width: number; height: number } | null => {
    const isPng =
        png.length >= 24 &&
        png[0] === 0x89 &&
        png.toString('ascii', 1, 4) === 'PNG';
    if (!isPng) return null;

    return {
        width: png.readUInt32BE(16),
        height: png.readUInt32BE(20),
    };
};

export const logoDataUrl = (logo: Buffer): string => {
    const isJpeg = logo[0] === 0xff && logo[1] === 0xd8;
    const mime = isJpeg ? 'image/jpeg' : 'image/png';

    return `data:${mime};base64,${logo.toString('base64')}`;
};
