import * as puppeteer from 'puppeteer-core';
import { Browser, PuppeteerLaunchOptions, Page, ElementHandle } from 'puppeteer-core';
import { logger } from '../logger';
import { wait } from '../util';

export interface ICrawlerOptions {
  parallelism?: number
  cacheExpirySeconds?: number
}

interface ICrawlerFullOptions extends ICrawlerOptions {
  parallelism: number
  cacheExpirySeconds: number
}

export const DefaultCrawlerOptions: ICrawlerFullOptions = {
  parallelism: 1,
  cacheExpirySeconds: 3600
};

export abstract class BaseCrawler {
  abstract run(): void;
  protected options: ICrawlerFullOptions;
  protected launchOptionsWithFlags: PuppeteerLaunchOptions;

  constructor (
    readonly launchOptions: PuppeteerLaunchOptions,
    options: ICrawlerOptions = {}
  ) {
    this.options = Object.assign({}, DefaultCrawlerOptions, options);

    // Luôn thêm các flags cần thiết cho GitHub Actions
    this.launchOptionsWithFlags = {
      ...launchOptions,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-accelerated-2d-canvas',
        '--disable-pdf-viewer',
        '--disable-features=IsolateOrigins,site-per-process',
        ...(launchOptions.args || [])
      ]
    };

    // Nếu có executablePath từ env, sử dụng nó
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      this.launchOptionsWithFlags.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
    }

    if (!this.isHeadless(launchOptions)) {
      if (this.options.parallelism !== 1) {
        logger.info('Not headless, capping parallelism to 1');
      }
      this.options.parallelism = 1;
    }
  }

  isHeadless (launchOptions: PuppeteerLaunchOptions): boolean {
    if (launchOptions.devtools) {
      return false;
    }
    return launchOptions.headless !== false;
  }

  private _browser: Browser|null = null;

  async getBrowser (): Promise<Browser> {
    if (this._browser === null) {
      try {
        logger.info('Launching browser with flags: ' + JSON.stringify(this.launchOptionsWithFlags.args));
        const browser = await puppeteer.launch(this.launchOptionsWithFlags);
        
        const pages = await browser.pages();
        await Promise.all(pages.map(page => page.close()));
        this._browser = browser;
        logger.info('Browser launched successfully');
      } catch (error) {
        logger.error('Failed to launch browser: ' + (error as Error).message);
        throw error;
      }
    }
    return this._browser;
  }

  async closeBrowser (): Promise<void> {
    if (this._browser) {
      try {
        await this._browser.close();
        this._browser = null;
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Failed to close browser: ' + (error as Error).message);
      }
    }
  }

  async newPage (url: string | undefined): Promise<Page> {
    try {
      const browser = await this.getBrowser();
      const page = await browser.newPage();
      
      // Set user agent để tránh bị phát hiện
      await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      if (url) {
        await page.goto(url, { waitUntil: 'networkidle2' });
      }
      return page;
    } catch (error) {
      logger.error('Failed to create new page: ' + (error as Error).message);
      throw error;
    }
  }

  async closePage (page: Page): Promise<void> {
    try {
      await page.close();
    } catch (error) {
      logger.error('Failed to close page: ' + (error as Error).message);
    }
  }

  async wait (durationMs: number = 0): Promise<void> {
    return wait(durationMs);
  }

  async waitFor (page: Page, selector: string, waitBefore: number = 0, extra?: string): Promise<void> {
    logger.debug(`waitFor: ${selector}`);

    if (waitBefore) {
      await this.wait(waitBefore);
    }

    const timeout = 10000;

    for (let i = 0; i < 4; i++) {
      try {
        await page.waitForSelector(selector, { visible: true, timeout });
        return;
      } catch (err) {
        if (i < 3) {
          logger.warn(`[i=${i}, extra=${extra}] waitFor() "${selector}" failed, retrying...`);
        } else {
          logger.error(`[i=${i}, extra=${extra}] waitFor() "${selector}" failed with ${err}`);
        }
      }
    }
  }

  async click (page: Page, selector: string, waitBefore = 0, extra = ''): Promise<void> {
    logger.debug(`click ${selector}`);

    if (waitBefore) {
      await this.wait(waitBefore);
    }

    for (let i = 0; i < 4; i++) {
      try {
        await page.click(selector);
        return;
      } catch (err) {
        if (i < 3) {
          logger.warn(`[i=${i}, extra=${extra}] click() "${selector}" failed, retrying...`);
        } else {
          logger.error(`[i=${i}, extra=${extra}] click() "${selector}" failed with ${err}`);
        }
      }
    }
  }

  async clickXPath (page: Page, selector: string, navigate = true, waitBefore = 0, extra = ''): Promise<void> {
    logger.debug(`clickXPath: ${selector}`);

    if (waitBefore) {
      await this.wait(waitBefore);
    }

    logger.debug(`Looking for the ${selector}`);
    const [btn] = await page.$x(selector);

    if (!btn) {
      logger.error(`Element not found: ${selector}`);
      return;
    }

    for (let i = 0; i < 4; i++) {
      try {
        await (btn as ElementHandle<Element>).click();
        if (navigate) {
          await page.waitForNavigation({ waitUntil: 'load', timeout: 30000 });
        }
        return;
      } catch (err) {
        if (i < 3) {
          logger.warn(`[i=${i}, extra=${extra}] clickXPath() "${selector}" failed, retrying...`);
        } else {
          logger.error(`[i=${i}, extra=${extra}] clickXPath() "${selector}" failed with ${err}`);
        }
      }
    }
  }

  async type (page: Page, selector: string, text: string, delay: number = 100): Promise<void> {
    try {
      await page.waitForSelector(selector, { visible: true, timeout: 10000 });
      await page.click(selector);
      await page.keyboard.down('Control');
      await page.keyboard.press('A');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await page.type(selector, text, { delay });
    } catch (error) {
      logger.error(`Failed to type into ${selector}: ${(error as Error).message}`);
      throw error;
    }
  }

  async screenshot (page: Page, filename: string = 'screenshot.png'): Promise<void> {
    try {
      await page.screenshot({ path: filename, fullPage: true });
      logger.info(`Screenshot saved to ${filename}`);
    } catch (error) {
      logger.error(`Failed to take screenshot: ${(error as Error).message}`);
    }
  }
}
