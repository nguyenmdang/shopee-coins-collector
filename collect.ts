import { PuppeteerLaunchOptions } from 'puppeteer-core';
import { getCookies } from './lib/config';
import { BaseCrawler } from './lib/crawlers/BaseCrawler';
import { ShopeeCrawler } from './lib/crawlers/ShopeeCrawler';

async function main () {
  const opt: PuppeteerLaunchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-accelerated-2d-canvas',
      '--disable-pdf-viewer',
      '--disable-features=IsolateOrigins,site-per-process'
    ],
    // Chỉ định executable path cho Chromium cài qua apt
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser'
  };

  const crawlers: BaseCrawler[] = [
    new ShopeeCrawler(opt, { }, getCookies())
  ];

  await Promise.all(crawlers.map(cr => cr.run()));
}

(async () => main())();
