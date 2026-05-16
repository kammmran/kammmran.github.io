const puppeteer = require('playwright');
(async () => {
  const browser = await puppeteer.chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('file://' + process.cwd() + '/game.html');
  // Wait a bit
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
