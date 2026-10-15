import sharp from 'sharp';
import { processLogoBuffer } from './processCompanyLogo';

describe('processLogoBuffer', () => {
    it('resizes to 100px width and outputs png', async () => {
        const input = await sharp({
            create: {
                width: 200,
                height: 80,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite([
                {
                    input: await sharp({
                        create: {
                            width: 40,
                            height: 40,
                            channels: 4,
                            background: { r: 0, g: 0, b: 0, alpha: 1 },
                        },
                    })
                        .png()
                        .toBuffer(),
                    left: 20,
                    top: 20,
                },
            ])
            .png()
            .toBuffer();

        const output = await processLogoBuffer(input, { forceWhite: true });
        const meta = await sharp(output).metadata();

        expect(meta.format).toBe('png');
        expect(meta.width).toBe(100);
        expect(meta.hasAlpha).toBe(true);
    });

    it('turns dark opaque pixels white when forceWhite is true', async () => {
        const input = await sharp({
            create: {
                width: 50,
                height: 50,
                channels: 4,
                background: { r: 20, g: 20, b: 20, alpha: 1 },
            },
        })
            .png()
            .toBuffer();

        const output = await processLogoBuffer(input, { forceWhite: true });
        const { data } = await sharp(output)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        expect(data[0]).toBe(255);
        expect(data[1]).toBe(255);
        expect(data[2]).toBe(255);
        expect(data[3]).toBeGreaterThan(0);
    });

    it('keeps original colors when forceWhite is false', async () => {
        const input = await sharp({
            create: {
                width: 50,
                height: 50,
                channels: 4,
                background: { r: 200, g: 10, b: 10, alpha: 1 },
            },
        })
            .png()
            .toBuffer();

        const output = await processLogoBuffer(input, { forceWhite: false });
        const { data } = await sharp(output)
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        expect(data[0]).toBeGreaterThan(150);
        expect(data[1]).toBeLessThan(40);
        expect(data[2]).toBeLessThan(40);
    });
});
