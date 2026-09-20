import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1600 }
  });

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url(), req.failure()?.errorText));
  page.on('response', res => {
    if (res.url().includes('/api/')) {
      console.log('API RESPONSE:', res.url(), res.status());
    }
  });

  console.log('Navigating to http://127.0.0.1:8000...');
  await page.goto('http://127.0.0.1:8000', { waitUntil: 'networkidle' });

  // Click on "Run attack" button
  console.log('Clicking Run attack button...');
  const runBtn = page.getByRole('button', { name: /Run attack/i });
  await runBtn.click();

  // Wait 10s for replay stream to finish completely
  await page.waitForTimeout(10000);

  console.log('Capturing screenshot to results/screenshot.png...');
  await page.screenshot({ path: 'results/screenshot.png', fullPage: true });

  await browser.close();
  console.log('Screenshot captured successfully.');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
