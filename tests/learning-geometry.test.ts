import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { buildModel } from '../lib/models.ts';
import { optimizeTeachingPanels } from '../lib/learning-panels.ts';
import { disposeModelResources } from '../lib/model-stage.ts';
await test('课程网孔优化减少几何量，保持包围尺寸并不改变原探索模型', () => {
  const previous = globalThis.document;
  globalThis.document = {
    createElement: () => ({
      width: 0,
      height: 0,
      getContext: () =>
        new Proxy(
          {},
          {
            get: (_, key) =>
              key === 'createImageData'
                ? (w: number, h: number) => ({
                    data: new Uint8ClampedArray(w * h * 4),
                  })
                : () => {},
          },
        ),
    }),
  } as unknown as Document;
  try {
    const reference = buildModel('pc'),
      teaching = buildModel('pc', { preserveAssemblies: true });
    const count = (root: T.Object3D) => {
      let n = 0;
      root.traverse((o) => {
        if (o instanceof T.Mesh)
          n +=
            (o.geometry.index?.count ?? o.geometry.attributes.position.count) /
            3;
      });
      return n;
    };
    const original = count(reference.root),
      bounds = new T.Box3().setFromObject(teaching.root),
      before = count(teaching.root);
    const saved = optimizeTeachingPanels(teaching.pieces);
    assert.ok(saved > 100000);
    assert.ok(count(teaching.root) < before - 100000);
    assert.equal(count(reference.root), original);
    const after = new T.Box3().setFromObject(teaching.root);
    assert.ok(
      bounds.min.distanceTo(after.min) < 0.00001 &&
        bounds.max.distanceTo(after.max) < 0.00001,
    );
    const baseline = buildModel('pc');
    assert.equal(count(baseline.root), original);
    for (const model of [reference, teaching, baseline])
      disposeModelResources(model);
  } finally {
    globalThis.document = previous;
  }
});
