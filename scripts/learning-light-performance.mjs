import { chromium } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  await page.goto(process.env.LEARNING_BASE_URL ?? 'http://127.0.0.1:4173/');
  await page.getByRole('combobox', { name: '画质' }).selectOption('low');
  await page.waitForFunction(
    () => document.querySelector('.lab-canvas')?.dataset.settled === 'true',
    null,
    { timeout: 120000 },
  );
  const host = page.locator('.lab-canvas'),
    bounds = await host.boundingBox();
  await page.mouse.move(bounds.x + 25, bounds.y + 90);
  await page.mouse.down();
  const start = await host.evaluate((e) => ({
    frame: Number(e.dataset.frameCount),
    time: performance.now(),
  }));
  for (let n = 0; n < 80; n++) {
    await page.mouse.move(bounds.x + 25 + n * 0.8, bounds.y + 90 + n * 0.3);
    await page.waitForTimeout(30);
  }
  const end = await host.evaluate((e) => ({
    frame: Number(e.dataset.frameCount),
    time: performance.now(),
  }));
  await page.mouse.up();
  const report = {
    testedAt: new Date().toISOString(),
    quality: 'low',
    browser: browser.version(),
    viewport: '1440×1000',
    seconds: Number(((end.time - start.time) / 1000).toFixed(2)),
    fps: Number(
      ((end.frame - start.frame) / ((end.time - start.time) / 1000)).toFixed(1),
    ),
    renderedFrames: end.frame - start.frame,
  };
  if (report.fps <= 0 || report.seconds > 20) throw Error('无有效帧率采样');
  await writeFile(
    'outputs/learning/performance-light.json',
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
