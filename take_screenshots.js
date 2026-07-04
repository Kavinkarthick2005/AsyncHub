const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function run() {
  const screenshotDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
  }

  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 1440, height: 900 } });
  const page = await browser.newPage();

  console.log("Capturing Landing Page...");
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(screenshotDir, 'landing.png') });

  console.log("Capturing Dashboard...");
  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle2' });
  // Wait a bit for React Query to load
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, 'dashboard.png') });

  console.log("Capturing Queues...");
  await page.goto('http://localhost:3000/queues', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, 'queues.png') });

  console.log("Capturing Workers...");
  await page.goto('http://localhost:3000/workers', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(screenshotDir, 'workers.png') });

  await browser.close();
  console.log("Screenshots saved to /screenshots directory!");
}

run().catch(console.error);
