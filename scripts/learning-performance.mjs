import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const base = process.env.LEARNING_BASE_URL ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const report = {
  testedAt: new Date().toISOString(),
  viewport: '1440×1000',
  quality: 'standard',
  switches: [],
  notes: [
    '内存包括本次独立自动化浏览器的全部进程；工作集可能重复计算共享页。',
    '帧率是连续旋转工作台期间的实际渲染次数/时间；并非所有设备的性能保证。',
  ],
};
try {
  await mkdir('outputs/learning', { recursive: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const devtools = await page.context().newCDPSession(page),
    browserTools = await browser.newBrowserCDPSession();
  await devtools.send('Performance.enable');
  async function memory() {
    const { processInfo } = await browserTools.send(
      'SystemInfo.getProcessInfo',
    );
    const ids = processInfo.map((p) => p.id).filter(Number.isInteger);
    const script = `Get-Process -Id ${ids.join(',')} -ErrorAction SilentlyContinue | Select-Object Id,WorkingSet64,PrivateMemorySize64 | ConvertTo-Json -Compress`;
    const raw = execFileSync(
      'powershell.exe',
      ['-NoProfile', '-Command', script],
      { encoding: 'utf8', windowsHide: true },
    ).trim();
    const processes = JSON.parse(raw),
      list = Array.isArray(processes) ? processes : [processes];
    const metrics = await devtools.send('Performance.getMetrics');
    return {
      processCount: list.length,
      workingSetMB: Math.round(
        list.reduce((n, p) => n + p.WorkingSet64, 0) / 1048576,
      ),
      privateCommitMB: Math.round(
        list.reduce((n, p) => n + p.PrivateMemorySize64, 0) / 1048576,
      ),
      jsHeapUsedMB: Math.round(
        (metrics.metrics.find((m) => m.name === 'JSHeapUsedSize')?.value ?? 0) /
          1048576,
      ),
    };
  }
  const ready = () =>
    page.waitForFunction(
      () =>
        document.querySelector('.lab-canvas')?.dataset.renderedMachine ===
          document.querySelector('.lab-canvas')?.dataset.machine &&
        document.querySelector('.lab-canvas')?.dataset.settled === 'true' &&
        Number(document.querySelector('.lab-canvas')?.dataset.triangles) > 0,
      null,
      { timeout: 120000 },
    );
  const click = (name) =>
    page.getByRole('button', { name, exact: true }).evaluate((b) => b.click());
  await page.goto(base);
  await ready();
  report.browser = browser.version();
  report.graphics = await page
    .locator('.lab-canvas canvas')
    .evaluate((canvas) => {
      const gl = canvas.getContext('webgl2'),
        ext = gl?.getExtension('WEBGL_debug_renderer_info');
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unavailable';
    });
  report.desktopMemory = await memory();
  report.renderingResolution = await page
    .locator('.lab-canvas canvas')
    .evaluate((canvas) => ({
      width: canvas.width,
      height: canvas.height,
      cssWidth: canvas.clientWidth,
      cssHeight: canvas.clientHeight,
    }));
  const measureFPS = async () => {
    await page.bringToFront();
    await page.locator('.lab-canvas canvas').focus();
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
    if (end.frame <= start.frame || end.time - start.time > 20000)
      throw Error('帧率采样无有效渲染或被休眠中断，不能报告为通过。');
    return {
      renderedFrames: end.frame - start.frame,
      fps: Number(
        ((end.frame - start.frame) / ((end.time - start.time) / 1000)).toFixed(
          1,
        ),
      ),
      seconds: Number(((end.time - start.time) / 1000).toFixed(2)),
    };
  };
  report.desktopRotation = await measureFPS();
  await click('部件百科');
  for (let i = 0; i < 20; i++) {
    await click(i % 2 === 0 ? '笔记本' : '台式机');
    await ready();
    await devtools.send('HeapProfiler.collectGarbage');
    const dataset = await page.locator('.lab-canvas').evaluate((e) => ({
      machine: e.dataset.machine,
      geometries: Number(e.dataset.geometries),
      textures: Number(e.dataset.textures),
      triangles: Number(e.dataset.triangles),
      drawCalls: Number(e.dataset.drawCalls),
    }));
    report.switches.push({
      switch: i + 1,
      ...dataset,
      ...(i === 0 || i === 9 || i === 19 ? { memory: await memory() } : {}),
    });
  }
  await click('笔记本');
  await ready();
  report.laptopMemory = await memory();
  report.laptopRotation = await measureFPS();
  report.resourcesStable =
    report.switches
      .filter((s) => s.machine === 'desktop')
      .every(
        (s) =>
          s.geometries === report.switches[1].geometries &&
          s.textures === report.switches[1].textures,
      ) &&
    report.switches
      .filter((s) => s.machine === 'laptop')
      .every(
        (s) =>
          s.geometries === report.switches[0].geometries &&
          s.textures === report.switches[0].textures,
      );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = String(error);
  console.error(error);
  process.exitCode = 1;
} finally {
  await writeFile(
    'outputs/learning/performance.json',
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
