import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

const url   = process.argv[2] || 'http://localhost:3000';
const label = process.argv[3] ? `-${process.argv[3]}` : '';

// Auto-increment
let n = 1;
while (fs.existsSync(path.join(screenshotsDir, `screenshot-${n}${label}.png`))) n++;
const outFile = path.join(screenshotsDir, `screenshot-${n}${label}.png`);

const browser = await puppeteer.launch({
  executablePath: (() => {
    // Try to find Chrome in the puppeteer cache
    const cacheDir = 'C:/Users/nateh/.cache/puppeteer';
    if (fs.existsSync(cacheDir)) {
      const entries = fs.readdirSync(cacheDir + '/chrome').sort().reverse();
      for (const entry of entries) {
        const exePath = `${cacheDir}/chrome/${entry}/chrome-win64/chrome.exe`;
        if (fs.existsSync(exePath)) return exePath;
      }
    }
    return undefined; // let puppeteer find it
  })(),
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 15000 });
await new Promise(r => setTimeout(r, 600));
await page.screenshot({ path: outFile, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outFile}`);
