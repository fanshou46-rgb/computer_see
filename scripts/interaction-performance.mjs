import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.LEARNING_BASE_URL ?? 'http://127.0.0.1:4173/';
const output =
  process.env.INTERACTION_PERF_OUTPUT ?? 'outputs/interaction/performance.json';
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const report = {
  url: base,
  viewport: '1440×1000',
  measurements: [],
  note: '输入延迟为指针按下事件至第二次 requestAnimationFrame 的近似显示耗时；帧间隔按实际场景帧计数采样。',
};
const p95 = (values) =>
  [...values].sort((a, b) => a - b)[
    Math.max(0, Math.ceil(values.length * 0.95) - 1)
  ];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  await page.goto(base);
  const ready = () =>
    page.waitForFunction(
      () => {
        const d = document.querySelector('.lab-canvas')?.dataset;
        return d?.settled === 'true' && d?.machine === d?.renderedMachine;
      },
      null,
      { timeout: 120000 },
    );
  await ready();
  report.version = await page.locator('.version').textContent();
  report.browser = browser.version();
  await page
    .getByRole('button', { name: '部件百科', exact: true })
    .evaluate((el) => el.click());
  for (const machine of ['desktop', 'laptop']) {
    await page
      .getByRole('button', {
        name: machine === 'desktop' ? '台式机' : '笔记本',
        exact: true,
      })
      .evaluate((el) => el.click());
    await ready();
    await page.waitForTimeout(1000);
    const host = page.locator('.lab-canvas'),
      bounds = await host.boundingBox();
    const samples = [];
    await page.evaluate(() => {
      window.__inputSamples = [];
      window.__inputListener = (e) => {
        if (!e.target.closest('.lab-canvas')) return;
        const t = performance.now();
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            window.__inputSamples.push(performance.now() - t),
          ),
        );
      };
      document.addEventListener('pointerdown', window.__inputListener, true);
    });
    for (let i = 0; i < 12; i++) {
      const point = await host.evaluate((el) =>
        JSON.parse(el.dataset.selectedPosition),
      );
      await page.mouse.move(point.x + 2, point.y + 2);
      await page.mouse.down();
      await page.mouse.move(point.x + 12, point.y + 5, { steps: 3 });
      await page.mouse.up();
      await page.waitForTimeout(180);
    }
    samples.push(
      ...(await page.evaluate(() => {
        document.removeEventListener(
          'pointerdown',
          window.__inputListener,
          true,
        );
        return window.__inputSamples;
      })),
    );
    await page
      .getByRole('button', { name: '复位视角', exact: true })
      .evaluate((el) => el.click());
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const host = document.querySelector('.lab-canvas');
      window.__frameTimes = [];
      window.__measure = true;
      let count = Number(host.dataset.frameCount),
        last = performance.now();
      const tick = (now) => {
        const next = Number(host.dataset.frameCount);
        if (next !== count) {
          window.__frameTimes.push(now - last);
          last = now;
          count = next;
        }
        if (window.__measure) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    await page.mouse.move(bounds.x + 15, bounds.y + 90);
    await page.mouse.down();
    const start = await host.evaluate((el) => ({
      time: performance.now(),
      frames: Number(el.dataset.frameCount),
    }));
    for (let n = 0; n < 80; n++) {
      await page.mouse.move(bounds.x + 15 + n * 0.7, bounds.y + 90 + n * 0.2);
      await page.waitForTimeout(30);
    }
    const end = await host.evaluate((el) => ({
      time: performance.now(),
      frames: Number(el.dataset.frameCount),
    }));
    await page.mouse.up();
    const intervals = await page.evaluate(() => {
      window.__measure = false;
      return window.__frameTimes.slice(2);
    });
    if (
      end.frames <= start.frames ||
      samples.length !== 12 ||
      !intervals.length
    )
      throw Error('Performance sampling incomplete');
    report.measurements.push({
      machine,
      inputSamples: samples.length,
      p95InputMs: Number(p95(samples).toFixed(1)),
      meanInputMs: Number(
        (samples.reduce((a, b) => a + b) / samples.length).toFixed(1),
      ),
      rotationFPS: Number(
        (
          ((end.frames - start.frames) * 1000) /
          (end.time - start.time)
        ).toFixed(1),
      ),
      p95FrameMs: Number(p95(intervals).toFixed(1)),
    });
  }
} catch (e) {
  report.failure = String(e);
  process.exitCode = 1;
} finally {
  await browser.close();
  await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true });
  await writeFile(output, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
}
