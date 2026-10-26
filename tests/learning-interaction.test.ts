import test from 'node:test';
import assert from 'node:assert/strict';
import {
  movedFrom,
  groundOpacity,
  removalAxis,
  inDropZone,
  viewDirection,
} from '../lib/learning-interaction.ts';
import {
  applyAction,
  probeAction,
  makeAssembly,
  partsFor,
  type Operation,
} from '../lib/learning-rules.ts';

await test('底部视角彻底隐藏地面，跨越地面时连续渐隐', () => {
  for (const surface of [-6.975, -0.575]) {
    assert.equal(groundOpacity(surface - 10, surface), 0);
    assert.equal(groundOpacity(surface, surface), 0);
    assert.equal(groundOpacity(surface + 2, surface), 1);
    let previous = 0;
    for (let y = surface; y < surface + 3; y += 0.01) {
      const opacity = groundOpacity(y, surface);
      assert.ok(opacity >= previous && opacity <= 1);
      previous = opacity;
    }
  }
  assert.ok(viewDirection('bottom').y < -0.99);
  assert.ok(viewDirection('top').y > 0.99);
});
await test('选择与拖动使用 CSS 像素阈值，细小投放目标仍可命中', () => {
  assert.equal(movedFrom(6, 0, 0, 0), false);
  assert.equal(movedFrom(6.01, 0, 0, 0), true);
  assert.equal(
    inDropZone(123, 100, { left: 99, top: 99, right: 101, bottom: 101 }),
    true,
  );
  assert.equal(
    inDropZone(125, 100, { left: 99, top: 99, right: 101, bottom: 101 }),
    false,
  );
  assert.equal(
    inDropZone(190, 50, { left: 0, top: 0, right: 200, bottom: 100 }),
    true,
  );
});
await test('插拔路径符合两种教学模型的安装面，方向向量归一化', () => {
  assert.equal(removalAxis('desktop', 'ram').z, 1);
  assert.equal(removalAxis('desktop', 'gpu').z, 1);
  assert.equal(removalAxis('desktop', 'psu').x, -1);
  assert.equal(removalAxis('laptop', 'keyboard').y, -1);
  assert.ok(removalAxis('laptop', 'nvme').y > 0);
  for (const machine of ['desktop', 'laptop'] as const)
    for (const part of partsFor(machine))
      assert.ok(Math.abs(removalAxis(machine, part.id).length() - 1) < 1e-9);
});
await test('所有预检与实际规则一致且不会改变存档状态', () => {
  const operations: Operation[] = [
    'install',
    'remove',
    'fasten',
    'loosen',
    'lock',
    'unlock',
    'connect',
    'disconnect',
  ];
  for (const machine of ['desktop', 'laptop'] as const)
    for (const assembled of [false, true]) {
      const state = makeAssembly(machine, assembled);
      if (assembled) {
        state.parts.panel.installed = false;
        state.parts.panel.fixed = false;
      }
      for (const part of partsFor(machine))
        for (const type of operations)
          for (const rotation of [0, 180]) {
            const before = JSON.stringify(state),
              action = { type, part: part.id, port: part.port, rotation };
            const preview = probeAction(state, action),
              result = applyAction(state, action);
            assert.deepEqual(preview, {
              ok: result.ok,
              message: result.message,
            });
            assert.equal(JSON.stringify(state), before);
          }
    }
});
