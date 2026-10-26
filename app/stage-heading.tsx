'use client';
import {zh} from '@/lib/chinese';
import { ArrowLeft, ChevronRight, MousePointerClick, X } from 'lucide-react';
import type { Concept } from '@/lib/manifest';
import { levelPath, levels, type LevelId } from '@/lib/levels';

type Props = {
  level: LevelId;
  explode: number;
  logical: boolean;
  selected: Concept | null;
  /** Show the first-visit line about what clicking does. */
  hint?: boolean;
  onDismissHint?: () => void;
  onNavigate: (level: LevelId) => void;
};

/** A tap cannot right-click, so a phone is told the two-tap version. */
function hintCopy() {
  return typeof matchMedia !== 'undefined' &&
    matchMedia('(pointer: coarse)').matches
    ? "轻点查看说明，再进入内部结构，也可以自动拆解。"
    : "左键进入部件，右键查看说明，也可以自动拆解。";
}

export default function StageHeading({
  level,
  explode,
  logical,
  selected,
  hint = false,
  onDismissHint,
  onNavigate,
}: Props) {
  const scale = levels[level],
    path = levelPath(level);
  return (
    <section className="stage-heading">
      <div>
        <h1>
          {explode === 100
            ? "零件展开"
            : explode > 0
              ? logical
                ? "资源展开"
                : "逐步拆解"
              : `${zh(scale.name)} · 结构探索`}
        </h1>
        {path.length > 1 && (
          <div className="stage-meta">
            <nav className="breadcrumbs" aria-label="部件层级">
              <button
                aria-label="返回上一层"
                onClick={() => onNavigate(path[path.length - 2])}
              >
                <ArrowLeft size={14} />
              </button>
              {path.map((id, i) => (
                <span key={id}>
                  {i > 0 && <ChevronRight size={12} />}
                  <button
                    aria-current={id === level ? 'page' : undefined}
                    onClick={() => onNavigate(id)}
                  >
                    {zh(levels[id].name)}
                  </button>
                </span>
              ))}
              {selected && selected.shortName !== scale.name && (
                <span>
                  <ChevronRight size={12} />
                  <span className="crumb-selected">{zh(selected.shortName)}</span>
                </span>
              )}
            </nav>
          </div>
        )}
        {hint && (
          <p className="first-visit-hint">
            <MousePointerClick size={15} aria-hidden="true" />
            <span>{hintCopy()}</span>
            <button aria-label="关闭提示" onClick={onDismissHint}>
              <X size={14} />
            </button>
          </p>
        )}
      </div>
    </section>
  );
}
