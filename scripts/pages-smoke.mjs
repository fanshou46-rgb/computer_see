import assert from 'node:assert/strict';
import http from 'node:http';
import path from 'node:path';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// No SPA fallback: broken subdirectory URLs must fail as they would on Pages.
const prefix = process.env.LAB_SMOKE_BASE ?? '/computer_see/';
const root = path.resolve(process.env.LAB_SMOKE_DIST ?? 'dist-pages');
const output = process.env.LAB_SMOKE_OUTPUT ?? 'outputs/pages-smoke';
const version = JSON.parse(await readFile('package.json', 'utf8')).version;
const types = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};
let server;
let browser;
const report = {
  version,
  checks: [],
  pageErrors: [],
  failedRequests: [],
  badResponses: [],
};
try {
  let base = process.env.PAGES_BASE_URL;
  if (!base) {
    server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, 'http://localhost');
        assert.ok(url.pathname.startsWith(prefix));
        const relative = decodeURIComponent(url.pathname.slice(prefix.length));
        let file = path.resolve(root, relative || '.');
        assert.ok(file === root || file.startsWith(root + path.sep));
        if ((await stat(file)).isDirectory())
          file = path.join(file, 'index.html');
        const body = await readFile(file);
        res.writeHead(200, {
          'Content-Type':
            types[path.extname(file)] ?? 'application/octet-stream',
        });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}${prefix}`;
  }
  assert.ok(base.endsWith('/'));
  report.url = base;
  const baseUrl = new URL(base);
  browser = await chromium.launch({
    executablePath:
      process.env.BROWSER_EXECUTABLE ??
      'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.setDefaultTimeout(30000);
  page.on('pageerror', (e) => report.pageErrors.push(e.message));
  page.on('requestfailed', (r) =>
    report.failedRequests.push({ url: r.url(), error: r.failure()?.errorText }),
  );
  page.on('response', (r) => {
    if (r.status() >= 400)
      report.badResponses.push({ url: r.url(), status: r.status() });
  });
  const ready = () =>
    page.waitForFunction(
      () => {
        const d = document.querySelector('.lab-canvas')?.dataset;
        return (
          Number(d?.triangles) > 0 &&
          d?.renderedMachine === d?.machine &&
          d?.settled === 'true'
        );
      },
      null,
      { timeout: 120000 },
    );
  const button = (name) => page.getByRole('button', { name, exact: true });
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await ready();
  assert.equal(await page.locator('.version').textContent(), `v${version}`);
  report.checks.push('中文课程首页、版本和 3D 教学场景加载');
  await button('开始本章小游戏').click();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('computer-lab-learning-v1')).step,
    ),
    'quiz',
  );
  await page.reload();
  await ready();
  assert.equal(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('computer-lab-learning-v1')).step,
    ),
    'quiz',
  );
  report.checks.push('进入小游戏后刷新恢复当前步骤');
  await button('自由探索').click();
  await page.waitForFunction(
    () => Number(document.querySelector('.viewport')?.dataset.triangles) > 0,
    null,
    { timeout: 120000 },
  );
  const guide = page.getByRole('link', { name: '硬件指南', exact: true });
  assert.equal(
    await guide.getAttribute('href'),
    baseUrl.pathname + 'guide/index.html',
  );
  await guide.click();
  assert.equal(page.url(), new URL('guide/index.html', base).href);
  assert.equal(await page.locator('section[id^="chapter-"]').count(), 10);
  const back = page.getByRole('link', { name: '← 返回 3D 学习空间' });
  assert.equal(new URL(await back.getAttribute('href'), page.url()).href, base);
  await back.click();
  assert.equal(page.url(), base);
  await ready();
  report.checks.push('自由探索懒加载、十章中文指南和返回链接');
  await page.goto(new URL('?scale=dimm', base).href, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForFunction(
    () => {
      const d = document.querySelector('.viewport')?.dataset;
      return d?.level === 'dimm' && Number(d?.triangles) > 0;
    },
    null,
    { timeout: 120000 },
  );
  await page.reload();
  await page.waitForFunction(
    () => document.querySelector('.viewport')?.dataset.level === 'dimm',
    null,
    { timeout: 120000 },
  );
  await button('返回课程').click();
  await page.reload();
  await ready();
  assert.equal(new URL(page.url()).pathname, baseUrl.pathname);
  assert.equal(new URL(page.url()).search, '');
  report.checks.push('内存部件直达链接、刷新和返回课程保留网站目录');
  const icon = new URL(
    await page.locator('link[rel="icon"]').getAttribute('href'),
    page.url(),
  );
  assert.ok(icon.pathname.startsWith(baseUrl.pathname));
  assert.equal((await page.request.get(icon.href)).status(), 200);
  await page.screenshot({
    path: path.join(output, 'home.png'),
    fullPage: true,
  });
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.failedRequests, []);
  assert.deepEqual(report.badResponses, []);
  report.checks.push('图标正常、浏览器无异常和 HTTP 错误');
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = String(error);
  console.error(error);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await mkdir(output, { recursive: true });
  await writeFile(
    path.join(output, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
