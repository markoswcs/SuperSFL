const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000/SuperSunflowerLand', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  
  const html = await page.content();
  console.log('HTML HAS SFL CARD?', html.includes('home-sfl-card'));
  
  await browser.close();
})();
