import { PuppeteerLaunchOptions } from 'puppeteer';
import { getCookies } from './lib/config';
import { BaseCrawler } from './lib/crawlers/BaseCrawler';
import { ShopeeCrawler } from './lib/crawlers/ShopeeCrawler';

async function main () {
  // THÊM CÁC FLAG CẦN THIẾT CHO GITHUB ACTIONS
  const opt: PuppeteerLaunchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-accelerated-2d-canvas',
      '--disable-pdf-viewer'
    ]
  };

  const crawlers: BaseCrawler[] = [
    new ShopeeCrawler(opt, { }, getCookies())
  ];

  await Promise.all(crawlers.map(cr => cr.run()));
}

(async () => main())();
