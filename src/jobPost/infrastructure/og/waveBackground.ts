import { OG_HEIGHT, OG_WIDTH } from './ogShared';
import { loadResvg } from './resvgBinding';

const BASE = '#0C0F0E';
const WAVE_COLORS = ['#141C18', '#121A16', '#161E1A'];

const hashSeed = (seed: string) => {
    let hash = 2166136261;
    for (const char of seed) {
        hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
    }

    return hash >>> 0;
};

const mulberry32 = (seed: number) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const waveFill = (
    rand: () => number,
    y: number,
): { d: string; color: string; opacity: number } => {
    const amplitude = 18 + rand() * 16;
    const wavelength = 520 + rand() * 340;
    const phase = rand() * Math.PI * 2;
    const points: string[] = [];
    for (let x = -40; x <= OG_WIDTH + 40; x += 20) {
        const wave =
            Math.sin((x / wavelength) * Math.PI * 2 + phase) * amplitude +
            Math.sin((x / (wavelength * 0.55)) * Math.PI * 2 + phase * 1.3) *
                amplitude *
                0.3;
        points.push(`${x} ${(y + wave).toFixed(1)}`);
    }

    return {
        d: `M ${points.join(' L ')} L ${OG_WIDTH + 40} ${OG_HEIGHT + 40} L -40 ${OG_HEIGHT + 40} Z`,
        color: WAVE_COLORS[Math.floor(rand() * WAVE_COLORS.length)],
        opacity: 0.16 + rand() * 0.1,
    };
};

export const renderWaveBackground = (seed: string): Buffer => {
    const rand = mulberry32(hashSeed(seed));
    const count = 8;
    const waves = Array.from({ length: count }, (_, index) => {
        const y = -30 + (index * (OG_HEIGHT + 60)) / (count - 1);

        return waveFill(rand, y);
    });
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
        <defs>
            <filter id="soft" x="-10%" y="-15%" width="120%" height="130%">
                <feGaussianBlur stdDeviation="18"/>
            </filter>
        </defs>
        <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BASE}"/>
        <g filter="url(#soft)">
        ${waves
            .map(
                (wave) =>
                    `<path d="${wave.d}" fill="${wave.color}" fill-opacity="${wave.opacity.toFixed(2)}"/>`,
            )
            .join('')}
        </g>
    </svg>`;

    const Resvg = loadResvg();

    return Buffer.from(
        new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } })
            .render()
            .asPng(),
    );
};
