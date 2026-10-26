import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { lessons, practiceAssembly } from '../lib/learning-courses.ts';
import { applyAction } from '../lib/learning-rules.ts';
const base = process.env.LEARNING_BASE_URL ?? 'http://127.0.0.1:4173/';
const output = process.env.INTERACTION_OUTPUT ?? 'outputs/interaction';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ??
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const report = { url: base, checks: [], errors: [], images: [] };
let page;
const mark = (text) => {
  report.checks.push(text);
  console.log('PASS', text);
};
try {
  const context = await browser.newContext({
    viewport: { width: 1512, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: true,
  });
  page = await context.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.setDefaultTimeout(30000);
  const canvas = () => page.locator('.lab-canvas');
  const data = () => canvas().evaluate((el) => ({ ...el.dataset }));
  const ready = () =>
    page.waitForFunction(
      () => {
        const d = document.querySelector('.lab-canvas')?.dataset;
        return (
          d?.settled === 'true' &&
          d?.machine === d?.renderedMachine &&
          Number(d?.triangles) > 0
        );
      },
      null,
      { timeout: 120000 },
    );
  const click = (name) =>
    page
      .getByRole('button', { name, exact: true })
      .evaluate((el) => el.click());
  const saved = () =>
    page.evaluate(() =>
      JSON.parse(localStorage.getItem('computer-lab-learning-v1')),
    );
  const view = async (name) => {
    await page.getByRole('combobox', { name: '观察视角' }).selectOption(name);
    await page.waitForTimeout(250);
  };
  async function pixels(name) {
    const png = await canvas().screenshot();
    await writeFile(output + '/' + name + '.png', png);
    const values = await page.evaluate(async (b64) => {
      const image = new Image();
      image.src = 'data:image/png;base64,' + b64;
      await image.decode();
      const c = document.createElement('canvas');
      c.width = image.width;
      c.height = image.height;
      const ctx = c.getContext('2d');
      ctx.drawImage(image, 0, 0);
      const p = ctx.getImageData(0, 0, c.width, c.height).data;
      let dark = 0,
        total = 0;
      for (let y = Math.floor(c.height * 0.18); y < c.height * 0.82; y += 3)
        for (let x = Math.floor(c.width * 0.1); x < c.width * 0.9; x += 3) {
          const i = (y * c.width + x) * 4;
          if (Math.min(p[i], p[i + 1], p[i + 2]) < 145) dark++;
          total++;
        }
      return { darkFraction: dark / total, width: c.width, height: c.height };
    }, png.toString('base64'));
    report.images.push({ name, ...values });
    assert.ok(
      values.darkFraction > 0.003,
      name + ' must contain visible hardware, not a uniform floor',
    );
  }
  async function fixture(machine = 'desktop', options = {}) {
    const id = machine === 'desktop' ? 3 : 9;
    const state = practiceAssembly(lessons[id - 1]);
    if (machine === 'laptop') state.parts.batteryCable.connected = false;
    if (options.detached) {
      state.parts.ram.installed = false;
      state.parts.ram.locked = false;
    }
    if (options.rotation) state.parts.ram.rotation = options.rotation;
    const progress = {
      schema: 1,
      completed: Array.from({ length: id - 1 }, (_, i) => i + 1),
      lesson: id,
      step: 'practice',
      question: 0,
      assembly: state,
      removed: options.detached ? ['ram'] : [],
    };
    await page.evaluate(
      (p) =>
        localStorage.setItem('computer-lab-learning-v1', JSON.stringify(p)),
      progress,
    );
    await page.reload();
    await ready();
    assert.equal((await data()).interaction, 'inspect');
    await page
      .locator('.part-tray [data-part="ram"]')
      .evaluate((el) => el.click());
    await ready();
    await click('复位视角');
    await page.waitForTimeout(300);
    return state;
  }
  async function coordinates() {
    const d = await data();
    return {
      from: JSON.parse(d.selectedPosition),
      to: JSON.parse(d.installPosition),
      world: JSON.parse(d.selectedWorldPositions),
      axis: JSON.parse(d.removalVector),
    };
  }
  async function startAt(from) {
    await page.mouse.move(from.x + 2, from.y + 2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    const d = await data();
    assert.equal(
      d.dragPart,
      'ram',
      'must grab the actual RAM, rather than an occluded part',
    );
  }
  await page.goto(base);
  await ready();
  report.version = await page.locator('.version').textContent();
  await click('部件百科');
  for (const machine of ['desktop', 'laptop']) {
    await click(machine === 'desktop' ? '台式机' : '笔记本');
    await ready();
    for (const quality of ['standard', 'low']) {
      await page.getByRole('combobox', { name: '画质' }).selectOption(quality);
      for (const angle of ['bottom', 'top', 'default']) {
        await view(angle);
        assert.equal(
          (await data()).groundVisible,
          angle === 'bottom' ? 'false' : 'true',
        );
        await pixels(machine + '-' + quality + '-' + angle);
      }
    }
    await click('散开观察');
    await view('bottom');
    await pixels(machine + '-expanded-bottom');
    await click('收回观察');
  }
  mark('两机型、两画质、上下视角与展开观察均有可见模型像素');
  await click('台式机');
  await ready();
  await view('default');
  let box = await canvas().boundingBox();
  await page.mouse.move(box.x + 20, box.y + box.height * 0.7);
  await page.mouse.down();
  await page.mouse.move(box.x + 20, box.y + box.height * 0.08, { steps: 30 });
  await page.mouse.up();
  await page.waitForTimeout(600);
  assert.equal((await data()).groundVisible, 'false');
  await pixels('mouse-orbit-underside');
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await view('default');
  await pixels('scroll-bottom');
  await page.setViewportSize({ width: 390, height: 844 });
  await canvas().scrollIntoViewIfNeeded();
  await view('bottom');
  await pixels('mobile-bottom');
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.setViewportSize({ width: 1512, height: 1080 });
  const other = await context.newPage();
  await other.goto('about:blank');
  await other.bringToFront();
  await page.bringToFront();
  await other.close();
  await view('default');
  await pixels('resume');
  mark('实际鼠标转到底部、页面滚动、小屏缩放和标签页返回正常');
  await page.evaluate(() =>
    localStorage.setItem(
      'computer-lab-learning-v1',
      JSON.stringify({
        schema: 1,
        completed: [],
        lesson: 1,
        step: 'quiz',
        question: 0,
        assembly: null,
        removed: [],
      }),
    ),
  );
  await page.reload();
  await ready();
  const quizPoint = JSON.parse((await data()).selectedPosition);
  const noticeBefore = await page.locator('.lab-notice').allTextContents();
  await page.mouse.move(quizPoint.x, quizPoint.y);
  await page.mouse.down();
  await page.mouse.move(quizPoint.x + 40, quizPoint.y + 10, { steps: 10 });
  await page.mouse.move(quizPoint.x, quizPoint.y, { steps: 10 });
  await page.mouse.up();
  assert.deepEqual(
    await page.locator('.lab-notice').allTextContents(),
    noticeBefore,
  );
  assert.equal(
    await page
      .getByRole('button', { name: '下一道小游戏', exact: true })
      .count(),
    0,
  );
  mark('找零件题中旋转并回到起点也不会误提交答案');
  await fixture('desktop', { detached: true });
  let points = await coordinates();
  const inspectState = (await saved()).assembly;
  await page.mouse.move(points.from.x, points.from.y);
  await page.mouse.down();
  await page.mouse.move(points.from.x + 55, points.from.y + 12, { steps: 15 });
  await page.mouse.up();
  assert.deepEqual((await saved()).assembly, inspectState);
  await click('复位视角');
  await page.waitForTimeout(300);
  await click('拖动零件');
  points = await coordinates();
  await startAt(points.from);
  await page.mouse.move(points.from.x + 16, points.from.y + 5, { steps: 6 });
  await page.waitForTimeout(100);
  const d = await data();
  const followed = JSON.parse(d.selectedPosition);
  assert.ok(
    Math.abs(followed.x - points.from.x - 14) < 4 &&
      Math.abs(followed.y - points.from.y - 3) < 4,
    'off-centre grab must preserve the grab offset',
  );
  const moved = JSON.parse(d.selectedWorldPositions);
  if (moved.length > 1)
    for (let axis = 0; axis < 3; axis++)
      assert.ok(
        Math.abs(
          moved[1][axis] -
            moved[0][axis] -
            (points.world[1][axis] - points.world[0][axis]),
        ) < 1e-6,
      );
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await ready();
  assert.deepEqual((await saved()).assembly, inspectState);
  assert.equal((await data()).dragging, 'false');
  await startAt(points.from);
  await page.mouse.move(points.from.x + 30, points.from.y + 25, { steps: 5 });
  await page.mouse.up();
  await ready();
  assert.deepEqual((await saved()).assembly, inspectState);
  mark('观察不拆卸；偏心抓取不跳动、套装间距保持、Esc 与无效投放复原');
  points = await coordinates();
  await startAt(points.from);
  await page.mouse.move(points.from.x + 12, points.from.y + 10, { steps: 5 });
  await canvas()
    .locator('canvas')
    .dispatchEvent('pointercancel', { pointerId: 1, pointerType: 'mouse' });
  await page.mouse.up();
  await ready();
  assert.equal(
    await canvas()
      .locator('canvas')
      .evaluate((el) => el.hasPointerCapture(1)),
    false,
  );
  points = await coordinates();
  await startAt(points.from);
  await page.mouse.move(points.from.x + 14, points.from.y, { steps: 5 });
  await click('旋转观察');
  await page.mouse.up();
  await ready();
  assert.deepEqual((await saved()).assembly, inspectState);
  assert.equal((await data()).interaction, 'inspect');
  const resizeCount = (await data()).resizeCount;
  await click('拖动零件');
  await click('旋转观察');
  await click('拖动零件');
  await ready();
  assert.equal((await data()).resizeCount, resizeCount);
  assert.equal('interaction' in (await saved()), false);
  points = await coordinates();
  await startAt(points.from);
  await page.mouse.move(points.from.x + 12, points.from.y, { steps: 4 });
  await click('部件百科');
  await click('笔记本');
  await page.mouse.up();
  await ready();
  assert.equal((await data()).machine, 'laptop');
  assert.equal((await data()).dragging, 'false');
  assert.deepEqual((await saved()).assembly, inspectState);
  mark('指针取消与拖动中切换工具释放捕获并保持存档');
  await fixture('desktop', { detached: true, rotation: 180 });
  await click('拖动零件');
  points = await coordinates();
  await startAt(points.from);
  await page.mouse.move(points.to.x + 2, points.to.y + 2, { steps: 30 });
  await page.waitForTimeout(150);
  assert.equal((await data()).dropStatus, 'blocked');
  await page.mouse.up();
  assert.equal((await saved()).assembly.parts.ram.installed, false);
  mark('反向内存显示阻挡反馈，松手不会安装');
  for (const machine of ['desktop', 'laptop']) {
    await fixture(machine, { detached: true });
    await click('拖动零件');
    points = await coordinates();
    await startAt(points.from);
    await page.mouse.move(points.to.x + 2, points.to.y + 2, { steps: 30 });
    await page.waitForTimeout(120);
    assert.equal((await data()).dropStatus, 'ready');
    await page.mouse.up();
    await ready();
    assert.equal((await saved()).assembly.parts.ram.installed, true);
    assert.equal((await saved()).assembly.parts.ram.locked, false);
    await click('撤销');
    await ready();
    assert.equal((await saved()).assembly.parts.ram.installed, false);
    // 已锁定的内存必须预先被挡住，不能先产生位移。
    await fixture(machine);
    await click('拖动零件');
    await click('聚焦选中部件');
    await page.waitForTimeout(300);
    points = await coordinates();
    await startAt(points.from);
    await page.mouse.move(points.from.x + 20, points.from.y - 15, { steps: 8 });
    await page.waitForTimeout(100);
    const fixed = JSON.parse((await data()).selectedWorldPositions);
    assert.deepEqual(fixed, points.world);
    assert.match(
      await page.locator('.lab-drag-feedback').textContent(),
      /锁扣|固定/,
    );
    await page.mouse.up();
    const original = (await saved()).assembly;
    const unlocked = applyAction(original, { type: 'unlock', part: 'ram' });
    assert.ok(unlocked.ok);
    const p = await saved();
    p.assembly = unlocked.state;
    await page.evaluate(
      (value) =>
        localStorage.setItem('computer-lab-learning-v1', JSON.stringify(value)),
      p,
    );
    await page.reload();
    await ready();
    await page
      .locator('.part-tray [data-part="ram"]')
      .evaluate((el) => el.click());
    await click('拖动零件');
    await click('聚焦选中部件');
    await page.waitForTimeout(300);
    points = await coordinates();
    await startAt(points.from);
    await page.mouse.move(
      points.from.x + 2 + points.axis.x * 1.1,
      points.from.y + 2 + points.axis.y * 1.1,
      { steps: 20 },
    );
    await page.mouse.up();
    await ready();
    assert.equal((await saved()).assembly.parts.ram.installed, false);
  }
  mark('两机型真实拖拽安装、未锁定判定、撤销、锁扣预检和沿轴拆卸通过');
  await fixture('desktop', { detached: true });
  await click('拖动零件');
  points = await coordinates();
  const beforeTouch = (await saved()).assembly;
  // 取消后在画布外松开，再换触屏；不能残留一个“幽灵指针”。
  await startAt(points.from);
  await page.mouse.move(points.from.x + 12, points.from.y + 8, { steps: 4 });
  await page.keyboard.press('Escape');
  await page.mouse.move(5, 5);
  await page.mouse.up();
  await ready();
  const cdp = await context.newCDPSession(page);
  const touch = (type, touchPoints) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints });
  const a = { x: points.from.x, y: points.from.y, id: 0 };
  await touch('touchStart', [a]);
  await touch('touchMove', [{ ...a, x: a.x + 15 }]);
  await touch('touchCancel', []);
  await ready();
  assert.deepEqual((await saved()).assembly, beforeTouch);
  box = await canvas().boundingBox();
  const center = { x: box.x + box.width * 0.55, y: box.y + box.height * 0.55 };
  const cameraBefore = (await data()).cameraPosition;
  await touch('touchStart', [{ x: center.x - 55, y: center.y, id: 0 }]);
  await touch('touchStart', [
    { x: center.x - 55, y: center.y, id: 0 },
    { x: center.x + 55, y: center.y, id: 1 },
  ]);
  for (let n = 1; n <= 8; n++)
    await touch('touchMove', [
      { x: center.x - 55 - n * 6, y: center.y, id: 0 },
      { x: center.x + 55 + n * 6, y: center.y, id: 1 },
    ]);
  await touch('touchEnd', []);
  await page.waitForTimeout(500);
  assert.notEqual((await data()).cameraPosition, cameraBefore);
  assert.deepEqual((await saved()).assembly, beforeTouch);
  mark('触屏取消复原、双指缩放有效且不提交零件操作');
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.passed = false;
  report.failure = String(error);
  console.error(error);
  process.exitCode = 1;
  if (page) {
    await page.screenshot({ path: output + '/failure.png', fullPage: true });
    report.lastState = await page
      .locator('.lab-canvas')
      .evaluate((el) => Object.fromEntries(Object.entries(el.dataset)))
      .catch(() => null);
  }
} finally {
  await writeFile(output + '/report.json', JSON.stringify(report, null, 2));
  await browser.close();
  console.log(JSON.stringify(report, null, 2));
}
