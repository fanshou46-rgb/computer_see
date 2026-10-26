import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('outputs/learning', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1080 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(process.env.LEARNING_BASE_URL ?? 'http://127.0.0.1:5173/');
  await page.waitForFunction(
    () => Number(document.querySelector('.lab-canvas')?.dataset.triangles) > 0,
    {},
    { timeout: 120000 },
  );
  await page.screenshot({
    path: 'outputs/learning/desktop.png',
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      errors,
      canvas: await page
        .locator('.lab-canvas')
        .evaluate((el) => Object.fromEntries(Object.entries(el.dataset))),
      title: await page.title(),
    }),
  );
  await page
    .getByRole('button', { name: '部件百科', exact: true })
    .evaluate((b) => b.click());
  await page
    .getByRole('button', { name: '笔记本', exact: true })
    .evaluate((b) => b.click());
  await page.waitForFunction(
    () =>
      document.querySelector('.lab-canvas')?.dataset.machine === 'laptop' &&
      Number(document.querySelector('.lab-canvas')?.dataset.triangles) > 0,
    {},
    { timeout: 120000 },
  );
  await page.screenshot({
    path: 'outputs/learning/laptop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'outputs/learning/mobile.png',
    fullPage: true,
  });
  console.log(
    JSON.stringify({
      errors,
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    }),
  );
  await writeFile(
    'outputs/learning/preview.json',
    JSON.stringify({ errors }, null, 2),
  );
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
