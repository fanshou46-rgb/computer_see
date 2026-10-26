'use client';
import {zh} from '@/lib/chinese';
import { useState } from 'react';
import {
  comparisonItem,
  type ComparisonViewState,
} from '@/lib/comparison-state';
import { useViewerEngine } from './use-viewer-engine';

type Props = {
  state: ComparisonViewState;
};

export default function ComparisonViewer({ state }: Props) {
  const [hover, setHover] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const left = comparisonItem(state.left),
    right = comparisonItem(state.right);
  const { host, error, ready } = useViewerEngine(
    state,
    {},
    () =>
      import('@/lib/comparison-scene').then(
        ({ createComparisonViewer }) => createComparisonViewer,
      ),
    (_current, reportError) => ({
      stats: () => {},
      hover: (name, x, y) =>
        setHover((previous) =>
          name
            ? previous?.name === name && previous.x === x && previous.y === y
              ? previous
              : { name, x, y }
            : null,
        ),
      error: reportError,
    }),
    "对比模型未能加载，请刷新重试。",
  );

  return (
    <>
      <div
        ref={host}
        className="comparison-viewport"
        data-active-side={state.activeSide}
        aria-label={`Synchronized 3D comparison of ${left.shortName} and ${right.shortName}`}
      >
        <section
          className="comparison-pane-a11y left"
          aria-label={`Left viewport: ${left.name}`}
        />
        <section
          className="comparison-pane-a11y right"
          aria-label={`Right viewport: ${right.name}`}
        />
      </div>
      {!ready && !error && (
        <output className="comparison-loading">正在加载两个模型…</output>
      )}
      {error && (
        <div className="comparison-error" role="alert">
          {error}
          <button onClick={() => location.reload()}>重新加载模型</button>
        </div>
      )}
      {hover && (
        <div
          className="hover-label comparison-hover"
          role="tooltip"
          style={{
            left: Math.max(8, Math.min(hover.x + 16, window.innerWidth - 220)),
            top: Math.max(10, Math.min(hover.y - 48, window.innerHeight - 70)),
          }}
        >
          {zh(hover.name)}
          <span>对比部件</span>
        </div>
      )}
    </>
  );
}
