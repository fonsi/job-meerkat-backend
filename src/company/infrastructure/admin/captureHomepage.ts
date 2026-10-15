import { chromium } from 'playwright';

const USER_AGENT =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const MAX_CANDIDATES = 12;

export type LogoDomCandidate = {
    id: number;
    selector: string;
    src?: string;
    tag: string;
    alt?: string;
    className?: string;
    cropPng: Buffer;
};

export type HomepageCapture = {
    screenshotPng: Buffer;
    finalUrl: string;
    candidates: LogoDomCandidate[];
};

type CandidateMeta = Omit<LogoDomCandidate, 'cropPng'>;

export const captureHomepage = async (
    homePage: string,
): Promise<HomepageCapture> => {
    const browser = await chromium.launch({ headless: true });
    try {
        const page = await browser.newPage({
            userAgent: USER_AGENT,
            viewport: { width: 1280, height: 800 },
        });
        page.setDefaultTimeout(45000);
        await page.goto(homePage, { waitUntil: 'domcontentloaded' });
        await page
            .waitForLoadState('networkidle', { timeout: 8000 })
            .catch(() => undefined);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const metas = (await page.evaluate(`(() => {
            const maxCandidates = ${MAX_CANDIDATES};
            const MAX_TOP = 200;
            const MAX_LEFT = 720;
            const seen = new Set();
            const items = [];
            const selectorGroups = [
                'header img, header svg, [role="banner"] img, [role="banner"] svg, nav img, nav svg',
                'a img, img, svg',
            ];
            for (const selector of selectorGroups) {
                for (const el of document.querySelectorAll(selector)) {
                    if (seen.has(el) || items.length >= maxCandidates) continue;
                    const rect = el.getBoundingClientRect();
                    if (rect.width < 10 || rect.height < 10) continue;
                    if (rect.bottom < 0 || rect.top > MAX_TOP) continue;
                    if (rect.left > MAX_LEFT) continue;
                    seen.add(el);
                    const id = items.length;
                    el.setAttribute('data-logo-candidate', String(id));
                    const src =
                        el.currentSrc ||
                        el.src ||
                        el.getAttribute('href') ||
                        undefined;
                    items.push({
                        id: id,
                        selector: '[data-logo-candidate="' + id + '"]',
                        src: src || undefined,
                        tag: el.tagName.toLowerCase(),
                        alt: el.alt || undefined,
                        className: el.getAttribute('class') || undefined,
                    });
                }
            }
            return items;
        })()`)) as CandidateMeta[];

        if (!Array.isArray(metas)) {
            throw new Error(
                'Failed to collect logo candidates from the homepage',
            );
        }

        const screenshotPng = await page.screenshot({ type: 'png' });
        const candidates: LogoDomCandidate[] = [];

        for (const meta of metas) {
            const locator = page.locator(meta.selector);
            try {
                const cropPng = await locator.screenshot({
                    type: 'png',
                    omitBackground: true,
                });
                candidates.push({ ...meta, cropPng });
            } catch {
                // element may be covered or detached after paint
            }
        }

        return {
            screenshotPng,
            finalUrl: page.url(),
            candidates,
        };
    } finally {
        await browser.close();
    }
};
