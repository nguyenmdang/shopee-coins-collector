import * as puppeteer from 'puppeteer-core'; // Đổi import
import { Browser, PuppeteerLaunchOptions, Page, ElementHandle } from 'puppeteer-core';
import { logger } from '../logger';
import { wait } from '../util';

// ... phần còn lại giữ nguyên

  async getBrowser (): Promise<Browser> {
    if (this._browser === null) {
      // Luôn thêm flags bắt buộc
      const options = {
        ...this.launchOptions,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          ...(this.launchOptions.args || [])
        ]
      };
      const browser = await puppeteer.launch(options);
      
      const pages = await browser.pages();
      await Promise.all(pages.map(page => page.close()));
      this._browser = browser;
    }
    return this._browser;
  }
