import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAction,
  completion,
  makeAssembly,
  nextAction,
  partComplete,
  partFor,
  partsFor,
  startupCheck,
  type Machine,
} from '../lib/learning-rules.ts';
import { lessons, practiceAssembly } from '../lib/learning-courses.ts';
import {
  freshProgress,
  restoreAssembly,
  restoreProgress,
} from '../lib/learning-progress.ts';
import { manifest, searchConcepts } from '../lib/manifest.ts';

function assemble(machine: Machine) {
  let state = makeAssembly(machine);
  for (let pass = 0; pass < 5; pass++)
    for (const part of partsFor(machine))
      for (let step = 0; step < 3; step++) {
        const action = nextAction(state, part.id);
        if (!action) break;
        const result = applyAction(state, action);
        if (!result.ok) break;
        state = result.state;
      }
  return state;
}
await test('两种机型都能通过合法操作完成整机组装', () => {
  for (const machine of ['desktop', 'laptop'] as const) {
    const state = assemble(machine);
    assert.equal(completion(state).done, completion(state).total, machine);
    assert.equal(startupCheck(state).stage, 'success');
  }
});
await test('错误操作不改原状态：方向、接口、缺少主板与未解锁', () => {
  let state = makeAssembly('desktop');
  assert.equal(applyAction(state, { type: 'install', part: 'cpu' }).ok, false);
  state = applyAction(state, { type: 'install', part: 'board' }).state;
  state = applyAction(state, { type: 'fasten', part: 'board' }).state;
  const before = structuredClone(state);
  assert.equal(
    applyAction(state, { type: 'install', part: 'ram', rotation: 180 }).ok,
    false,
  );
  assert.deepEqual(state, before);
  state = applyAction(state, { type: 'install', part: 'ram' }).state;
  state = applyAction(state, { type: 'lock', part: 'ram' }).state;
  assert.equal(applyAction(state, { type: 'remove', part: 'ram' }).ok, false);
  const powered = assemble('desktop');
  powered.parts.panel.installed = false;
  powered.parts.panel.fixed = false;
  powered.parts.eps.connected = false;
  const bad = applyAction(powered, {
    type: 'connect',
    part: 'eps',
    port: 'gpu12',
  });
  assert.equal(bad.ok, false);
  assert.strictEqual(bad.state, powered);
});
await test('放入槽中不代表完成，必须恢复固定与锁扣', () => {
  const state = assemble('desktop');
  state.parts.ram.locked = false;
  state.parts.gpu.fixed = false;
  assert.equal(partComplete(state, partFor('desktop', 'ram')!), false);
  assert.equal(partComplete(state, partFor('desktop', 'gpu')!), false);
  assert.equal(startupCheck(state).stage, 'post');
});
await test('CPU 散热器与 M.2 散热盖阻挡拆卸；外壳先开', () => {
  const state = assemble('desktop');
  assert.equal(applyAction(state, { type: 'loosen', part: 'board' }).ok, false);
  state.parts.panel.installed = false;
  state.parts.panel.fixed = false;
  assert.equal(applyAction(state, { type: 'unlock', part: 'cpu' }).ok, false);
  state.parts.nvme.fixed = false;
  assert.equal(applyAction(state, { type: 'remove', part: 'nvme' }).ok, false);
});
await test('笔记本先断电、排线先解锁，最后恢复电池与底盖', () => {
  let state = assemble('laptop');
  state.parts.panel.installed = false;
  state.parts.panel.fixed = false;
  assert.equal(applyAction(state, { type: 'unlock', part: 'ram' }).ok, false);
  state = applyAction(state, {
    type: 'disconnect',
    part: 'batteryCable',
  }).state;
  assert.equal(
    applyAction(state, { type: 'disconnect', part: 'keyboardCable' }).ok,
    false,
  );
  state = applyAction(state, { type: 'unlock', part: 'keyboardCable' }).state;
  state = applyAction(state, {
    type: 'disconnect',
    part: 'keyboardCable',
  }).state;
  assert.equal(
    applyAction(state, {
      type: 'connect',
      part: 'batteryCable',
      port: 'batteryPort',
    }).ok,
    false,
  );
  state = applyAction(state, {
    type: 'connect',
    part: 'keyboardCable',
    port: 'keyboardZif',
  }).state;
  state = applyAction(state, { type: 'lock', part: 'keyboardCable' }).state;
  assert.equal(
    applyAction(state, {
      type: 'connect',
      part: 'batteryCable',
      port: 'batteryPort',
    }).ok,
    true,
  );
});
await test('硬件自检失败与未找到启动设备分开反馈', () => {
  const state = assemble('desktop');
  state.parts.nvme.installed = false;
  state.parts.nvme.fixed = false;
  assert.equal(startupCheck(state).stage, 'boot');
  state.parts.eps.connected = false;
  assert.equal(startupCheck(state).stage, 'post');
});
await test('十章课程、不同小游戏类型和局部练习均可完成', () => {
  assert.equal(lessons.length, 10);
  const kinds = new Set(lessons.flatMap((l) => l.questions.map((q) => q.kind)));
  assert.deepEqual([...kinds].sort(), [
    'composition',
    'connector',
    'find',
    'function',
  ]);
  for (const lesson of lessons.filter((l) => l.practice.length)) {
    let state = practiceAssembly(lesson);
    if ([3, 9].includes(lesson.id))
      for (const id of lesson.practice) {
        const p = partFor(lesson.machine, id)!;
        for (const type of [
          'unlock',
          'loosen',
          p.kind === 'cable' ? 'disconnect' : 'remove',
        ] as const) {
          const result = applyAction(state, { type, part: id });
          if (result.ok) state = result.state;
        }
      }
    for (let pass = 0; pass < 5; pass++)
      for (const id of lesson.practice)
        for (let n = 0; n < 3; n++) {
          const action = nextAction(state, id);
          if (!action) break;
          const r = applyAction(state, action);
          if (r.ok) state = r.state;
          else break;
        }
    assert.ok(
      lesson.practice.every((id) =>
        partComplete(state, partFor(lesson.machine, id)!),
      ),
      `第${lesson.id}章`,
    );
  }
});
await test('存档恢复、坏存档和旧版本保留进度', () => {
  const progress = {
    ...freshProgress(),
    completed: [1, 2],
    lesson: 3,
    step: 'practice',
    assembly: practiceAssembly(lessons[2]),
    removed: ['ram'],
  };
  assert.equal(restoreProgress(JSON.stringify(progress)).recovered, false);
  assert.deepEqual(
    restoreProgress(JSON.stringify(progress)).progress.assembly,
    progress.assembly,
  );
  assert.equal(restoreProgress('{broken').recovered, true);
  const old = restoreProgress(JSON.stringify({ ...progress, schema: 0 }));
  assert.deepEqual(old.progress.completed, [1, 2]);
  assert.equal(old.progress.step, 'learn');
  const broken = structuredClone(progress);
  broken.assembly.parts.ram.fixed = true;
  broken.assembly.parts.ram.installed = false;
  const recovered = restoreProgress(JSON.stringify(broken));
  assert.equal(recovered.recovered, true);
  assert.deepEqual(recovered.progress.completed, [1, 2]);
  assert.equal(restoreAssembly({ machine: 'phone', parts: {} }), null);
  assert.equal(
    restoreProgress(
      JSON.stringify({ ...progress, completed: [1, 3, 9], lesson: 10 }),
    ).progress.lesson,
    2,
  );
});
await test('中文部件搜索与原英文搜索同时可用，英文详细原文保留', () => {
  assert.ok(searchConcepts('内存').length > 0);
  assert.ok(searchConcepts('memory').length > 0);
  assert.ok(manifest.every((c) => c.english?.description));
});
await test('撤销使用之前的快照，不污染其余部件', () => {
  const before = makeAssembly('desktop'),
    saved = structuredClone(before);
  const after = applyAction(before, { type: 'install', part: 'board' });
  assert.ok(after.ok);
  assert.deepEqual(before, saved);
  assert.notDeepEqual(after.state, before);
  assert.deepEqual(structuredClone(saved), before);
});
