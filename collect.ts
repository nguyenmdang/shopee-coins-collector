const { getCookies } = require('./lib/config');
const { ShopeeCrawler } = require('./lib/crawlers/ShopeeCrawler');

async function main() {
  // Cấu hình với đầy đủ flags
  const opt = {
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
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
  };

  const crawlers = [
    new ShopeeCrawler(opt, {}, getCookies())
  ];

  await Promise.all(crawlers.map(cr => cr.run()));
}

main().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
