import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';

const IMAGE_MODEL = 'gpt-image-1';
const CONVERT_PROMPT = `This image is a company's logo, possibly an icon, a wordmark, or both.
Create a clean white logomark on a fully transparent background for a dark website.

Rules:
- Preserve the original geometry and proportions exactly. Do not restyle, add, or invent shapes.
- Prefer the icon/symbol only. If the image is icon + company name, drop the name and keep only the mark.
- If there is no separate icon, keep the wordmark but make it solid white.
- Tight crop, no padding, no drop shadows, no extra background shapes.
- Every visible pixel must be white (#FFFFFF) on transparency.`;

let openai: OpenAI | undefined;

const getOpenAI = (): OpenAI => {
    if (!openai) openai = new OpenAI();

    return openai;
};

const isSvg = (input: Buffer): boolean => {
    const head = input.subarray(0, 256).toString('utf8').toLowerCase();

    return head.includes('<svg') || head.includes('<?xml');
};

const toPng = async (input: Buffer): Promise<Buffer> => {
    const pipeline = isSvg(input)
        ? sharp(input, { density: 400 })
        : sharp(input);

    return pipeline
        .ensureAlpha()
        .resize({
            width: 1024,
            height: 1024,
            fit: 'inside',
            withoutEnlargement: true,
        })
        .png()
        .toBuffer();
};

export const convertLogoToWhiteMark = async (
    original: Buffer,
): Promise<Buffer> => {
    const png = await toPng(original);
    const image = await toFile(png, 'logo.png', { type: 'image/png' });
    const result = await getOpenAI().images.edit({
        model: IMAGE_MODEL,
        image,
        prompt: CONVERT_PROMPT,
        background: 'transparent',
        size: '1024x1024',
        quality: 'medium',
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error('Image model did not return a logo PNG');

    return Buffer.from(b64, 'base64');
};
