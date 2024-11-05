import puppeteer, { Browser, Page } from 'puppeteer';

type ScrapProcessData = {
    browser: Browser;
    page: Page;
}

type ScrapData<T> = {
    scrapProcess: (data: ScrapProcessData) => Promise<T>;
    initialUrl: string;
}

const headless = true;

export const scrap = async <T>({ scrapProcess, initialUrl }: ScrapData<T>): Promise<T> => {
    let browser: Browser;
    try {
        browser = await puppeteer.launch({ headless });
        
        const page = await browser.newPage();
        await page.setViewport({width: 1080, height: 1024});
        await page.goto(initialUrl);

        return await scrapProcess({ browser, page });
    } finally {
        await browser?.close();
    }
}