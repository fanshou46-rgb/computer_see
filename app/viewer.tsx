'use client';
import {zh} from '@/lib/chinese';
import { useState } from 'react';
import type { ExplorerState, Selection } from '@/lib/explorer-state';
import type { PartLabel } from '@/lib/inventory-labels';
import { useViewerEngine } from './use-viewer-engine';
type Props = {
  state: ExplorerState;
  /** Nothing has been drawn yet. */
  loading: boolean;
  onSelect: (v: Selection | null, intent: 'open' | 'inspect') => void;
  onCount: (v: number) => void;
  /** The scene has cleared the stage around the part being opened. */
  onDived: () => void;
};
export default function Viewer({
  state,
  loading,
  onSelect,
  onCount,
  onDived,
}: Props) {
  const [hover, setHover] = useState<{
    name: string;
    x: number;
    y: number;
    opens: boolean;
  } | null>(null);
  const [labels, setLabels] = useState<PartLabel[]>([]);
  const { host, error, ready } = useViewerEngine(
    state,
    { onSelect, onCount, onDived },
    () => import('@/lib/scene').then(({ createViewer }) => createViewer),
    (current, reportError) => ({
      select: (value, intent) => current().onSelect(value, intent),
      stats: (value) => current().onCount(value),
      dived: () => current().onDived(),
      hover: (name, x, y, opens) =>
        setHover((previous) =>
          name
            ? previous?.name === name &&
              previous.x === x &&
              previous.y === y &&
              previous.opens === opens
              ? previous
              : { name, x, y, opens }
            : null,
        ),
      labels: setLabels,
      error: reportError,
    }),
    "3D 模型未能加载，请刷新重试。",
  );
  return (
    <>
      <div
        ref={host}
        className="viewport"
        aria-label="可交互的 3D 电脑模型"
      >
        {labels.length > 0 && (
          <ul className="part-labels" aria-label="托盘中的部件">
            {labels.map((label) => (
              <li
                key={label.concept}
                style={{ left: label.left, top: label.top }}
              >
                <button
                  onClick={() =>
                    onSelect(
                      { concept: label.concept, instance: label.instance },
                      'inspect',
                    )
                  }
                  aria-pressed={state.selection?.concept === label.concept}
                >
                  {zh(label.name)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* One message at a time: the loading line until the first frame
          reports in, unless the viewer failed, when the error replaces it
          rather than being drawn underneath it. */}
      {loading && !error && (
        <div className="empty-scene loading">
          <h3>正在准备部件模型…</h3>
        </div>
      )}
      {!ready && !error && (
        <output className="viewer-status sr-only">加载中…</output>
      )}
      {error && (
        <div className="viewer-status error" role="alert">
          {error}
          <button onClick={() => location.reload()}>重新加载模型</button>
        </div>
      )}
      {hover && (
        <div
          className="hover-label"
          role="tooltip"
          style={{
            left: Math.max(8, Math.min(hover.x + 16, window.innerWidth - 276)),
            top: Math.max(10, Math.min(hover.y - 60, window.innerHeight - 80)),
          }}
        >
          {zh(hover.name)}
          <span>
            {hover.opens
              ? "左键进入 · 右键查看说明"
              : "点击查看说明"}
          </span>
        </div>
      )}
    </>
  );
}
