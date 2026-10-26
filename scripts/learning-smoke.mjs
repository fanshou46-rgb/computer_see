import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { lessons } from '../lib/learning-courses.ts';
import {
  applyAction,
  nextAction,
  partFor,
  partComplete,
  partsFor,
  operationNames,
} from '../lib/learning-rules.ts';
const base = process.env.LEARNING_BASE_URL ?? 'http://127.0.0.1:5173';
await mkdir('outputs/learning', { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const report = { chapters: [], errors: [], checks: [] };
try {
  const page = await browser.newPage({
    viewport: { width: 1512, height: 1080 },
    deviceScaleFactor: 1,
  });
  page.on('pageerror', (e) => report.errors.push(e.message));
  const click = async (locator) => {
    await locator.waitFor();
    await locator.evaluate((b) => b.click());
  };
  const button = (name, scope = page) =>
    scope.getByRole('button', { name, exact: true });
  const panel = page.locator('.lesson-panel');
  const saved = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem('computer-lab-learning-v1')),
    );
  async function ready() {
    await page.waitForFunction(
      () =>
        Number(document.querySelector('.lab-canvas')?.dataset.triangles) > 0 &&
        document.querySelector('.lab-canvas')?.dataset.renderedMachine === document.querySelector('.lab-canvas')?.dataset.machine && document.querySelector('.lab-canvas')?.dataset.settled === 'true',
      null,
      { timeout: 120000 },
    );
  }
  async function action(action) {
    await click(page.locator(`.part-tray [data-part="${action.part}"]`));
    if (action.type === 'connect')
      await panel
        .getByRole('combobox', { name: '连接接口' })
        .selectOption(action.port);
    await click(button(operationNames[action.type], panel));
  }
  await page.goto(base);
  await ready();
  await page.screenshot({ path: 'outputs/learning/home.png', fullPage: true });
  for (const lesson of lessons) {
    console.log('Chapter', lesson.id, lesson.subtitle);
    assert.equal((await saved()).lesson, lesson.id);
    await click(
      button(
        lesson.questions.length ? '开始本章小游戏' : '开始整机挑战',
        panel,
      ),
    );
    for (let i = 0; i < lesson.questions.length; i++) {
      const q = lesson.questions[i];
      await page.waitForFunction(
        (prompt) =>
          document.querySelector('.lesson-panel h3')?.textContent === prompt,
        q.prompt,
      );
      if (lesson.id === 1 && i === 0) {
        await click(
          panel
            .locator('.answer-options button')
            .nth(q.options.findIndex((o) => o.id !== q.answer)),
        );
        assert.equal((await saved()).question, 0);
        report.checks.push('错误回答可重试');
      }
      if (q.kind === 'find')
        await click(page.locator(`.part-tray [data-part="${q.target}"]`));
      else
        await click(
          panel.locator('.answer-options button').nth(Number(q.answer)),
        );
      await click(
        button(
          i === lesson.questions.length - 1 ? '进入动手练习' : '下一道小游戏',
          panel,
        ),
      );
    }
    await page.waitForFunction(
      () =>
        JSON.parse(localStorage.getItem('computer-lab-learning-v1')).step ===
        'practice',
    );
    if ([3, 9].includes(lesson.id)) {
      for (const id of lesson.practice) {
        let progress = await saved();
        const part = partFor(lesson.machine, id);
        for (const type of [
          'unlock',
          'loosen',
          part.kind === 'cable' ? 'disconnect' : 'remove',
        ]) {
          const result = applyAction(progress.assembly, { type, part: id });
          if (result.ok) {
            await action({ type, part: id });
            progress = await saved();
          }
        }
      }
    }
    if (lesson.id === 3) {
      await click(page.locator('.part-tray [data-part="ram"]'));
      await click(panel.locator('.rotate-part'));
      await action({ type: 'install', part: 'ram' });
      assert.equal((await saved()).assembly.parts.ram.installed, false);
      await click(panel.locator('.rotate-part'));
      report.checks.push('反向内存不能安装');
      const before = (await saved()).assembly;
      for (let n = 0; n < 3; n++) await click(panel.locator('.hint-button'));
      await page.waitForFunction(
        () => !!document.querySelector('.demo-banner'),
      );
      await page.waitForFunction(
        () => !document.querySelector('.demo-banner'),
        null,
        { timeout: 10000 },
      );
      assert.deepEqual((await saved()).assembly, before);
      report.checks.push('三级示范还原，不自动过关');
      await page.reload();
      await ready();
      assert.equal((await saved()).lesson, 3);
      assert.equal((await saved()).step, 'practice');
      report.checks.push('拆装中刷新恢复');
      // 使用实际鼠标从托盘模型拖到安装位置，而非调用操作规则。
      await click(page.locator('.part-tray [data-part="ram"]'));
      await click(button('拖动零件'));
      await ready();
      const points = await page
        .locator('.lab-canvas')
        .evaluate((el) => ({
          from: JSON.parse(el.dataset.selectedPosition),
          to: JSON.parse(el.dataset.installPosition),
        }));
      await page.mouse.move(points.from.x, points.from.y);
      await page.mouse.down();
      await page.mouse.move(points.to.x, points.to.y, { steps: 24 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      if ((await saved()).assembly.parts.ram.installed)
        report.checks.push('实际 3D 拖拽安装内存通过');
      else throw Error('3D 内存拖拽未能安装');
      await action({ type: 'lock', part: 'ram' });
      const locked = (await saved()).assembly.parts.ram.locked;
      assert.equal(locked, true);
      await click(button('撤销'));
      assert.equal((await saved()).assembly.parts.ram.locked, false);
      report.checks.push('撤销恢复锁扣状态');
    }
    if (lesson.id === 8) {
      await click(button('检查并模拟开机', panel));
      assert.match(
        await page.locator('.lab-notice').innerText(),
        /硬件自检未通过/,
      );
      report.checks.push('未装好不能开机');
    }
    const ids = lesson.practice.length
      ? lesson.practice
      : partsFor(lesson.machine).map((p) => p.id);
    for (let pass = 0; pass < 5; pass++)
      for (const id of ids)
        for (let n = 0; n < 3; n++) {
          const progress = await saved(),
            next = nextAction(progress.assembly, id);
          if (!next) break;
          if (!applyAction(progress.assembly, next).ok) break;
          await action(next);
        }
    const progress = await saved();
    assert.ok(
      ids.every((id) =>
        partComplete(progress.assembly, partFor(lesson.machine, id)),
      ),
      `Chapter ${lesson.id} could not complete`,
    );
    if (lesson.id === 7) {
      await action({ type: 'disconnect', part: 'eps' });
      await click(page.locator('.part-tray [data-part="eps"]'));
      await panel
        .getByRole('combobox', { name: '连接接口' })
        .selectOption('gpu12');
      await click(button('连接接口', panel));
      assert.equal((await saved()).assembly.parts.eps.connected, false);
      report.checks.push('错误供电接口被拒绝');
      await action({ type: 'connect', part: 'eps', port: 'eps8' });
    }
    if (lesson.id === 8 || lesson.id === 10) {
      await page.screenshot({
        path: `outputs/learning/assembled-${lesson.machine}.png`,
        fullPage: true,
      });
      await click(button('检查并模拟开机', panel));
      await click(button('领取组装纪念卡'));
      await page.screenshot({
        path: `outputs/learning/completed-${lesson.machine}.png`,
        fullPage: true,
      });
    } else await click(button('完成动手练习', panel));
    await click(
      button(lesson.id === 10 ? '保存通关纪念' : '完成本章，继续学习', panel),
    );
    assert.ok((await saved()).completed.includes(lesson.id));
    report.chapters.push({
      id: lesson.id,
      name: lesson.subtitle,
      passed: true,
    });
  }
  await page.reload();
  await ready();
  assert.equal((await saved()).completed.length, 10);
  report.checks.push('十章通关进度持久化');
  await click(button('自由探索'));
  await page.waitForFunction(
    () => Number(document.querySelector('.viewport')?.dataset.triangles) > 0,
    null,
    { timeout: 120000 },
  );
  await click(button('搜索部件'));
  await page.getByRole('combobox').fill('内存');
  assert.ok((await page.getByRole('option').count()) > 0);
  await page.keyboard.press('Escape');
  report.checks.push('中文自由探索搜索');
  await click(button('返回课程'));
  await page.reload();
  await ready();
  assert.ok(await page.locator('.course-rail').isVisible());
  report.checks.push('探索返回与刷新不丢课程');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'outputs/learning/course-mobile.png',
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  report.checks.push('390px 无横向溢出');
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  report.failure = String(error);
  console.error(error);
  process.exitCode = 1;
  const pages = browser.contexts()[0]?.pages();
  if (pages?.[0]) {
    await pages[0].screenshot({
      path: 'outputs/learning/smoke-failure.png',
      fullPage: true,
    });
    report.lastState = await pages[0].evaluate(() => ({
      saved: localStorage.getItem('computer-lab-learning-v1'),
      panel: document.querySelector('.lesson-panel')?.textContent,
    }));
  }
} finally {
  await writeFile(
    'outputs/learning/smoke-report.json',
    JSON.stringify(report, null, 2),
  );
  await browser.close();
}
