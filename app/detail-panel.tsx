'use client';
import {
  ArrowUpRight,
  ChevronRight,
  EyeOff,
  Focus,
  Maximize,
  X,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { byId, colors, openLevel, sources, type Concept } from '@/lib/manifest';
import type { Selection } from '@/lib/explorer-state';
import { levels, type LevelId } from '@/lib/levels';
import {zh} from '@/lib/chinese';

type Props = {
  selected: Concept | null;
  selection: Selection | null;
  level: LevelId;
  isolated: boolean;
  onClose: () => void;
  onSelectConcept: (id: string) => void;
  onDive: (id: string) => void;
  onIsolate: () => void;
  onFocus: () => void;
  onHide: (id: string) => void;
};

export default function DetailPanel({
  selected,
  selection,
  level,
  isolated,
  onClose,
  onSelectConcept,
  onDive,
  onIsolate,
  onFocus,
  onHide,
}: Props) {
  const opens = selected && openLevel(selected.id);
  return (
    <Sheet
      open={!!selected}
      modal={false}
      onOpenChange={(open, details) => {
        if (!open && details.reason !== 'outside-press') onClose();
      }}
    >
      <SheetContent
        className="detail-panel"
        side="right"
        showCloseButton={false}
        initialFocus={false}
      >
        {selected && (
          <>
            <div className="detail-top">
              <span style={{ color: colors[selected.category] }}>
                {zh(selected.category)} /{' '}
                {selected.representationType === 'logical'
                  ? '原理示意'
                  : '实体结构'}
              </span>
              <button aria-label="关闭部件详情" onClick={onClose}>
                <X size={17} />
              </button>
            </div>
            <SheetTitle>{zh(selected.name)}</SheetTitle>
            <div className="instance-label">
              {selection?.instance !== undefined
                ? 'INSTANCE ' + String(selection.instance + 1).padStart(2, '0')
                : 'COMPONENT GROUP'}
            </div>
            <SheetDescription>{selected.description}</SheetDescription>
            <div className="purpose">
              <h3>作用与功能</h3>
              <p>{selected.purpose}</p>
            </div>
            {selected.english && <details className="english-reference"><summary>英文原文与详细解说</summary><strong>{zh(selected.english.name)}</strong><p>{selected.english.description}</p><p>{selected.english.purpose}</p></details>}
            <div className="quantity">{selected.quantity}</div>
            <dl>
              {Object.entries(selected.specifications).map(([k, v]) => (
                <div key={k}>
                  <dt>{zh(k)}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            {selected.parent && (
              <div className="parent-link">
                所属部件{' '}
                <button onClick={() => onSelectConcept(selected.parent!)}>
                  {zh(byId[selected.parent].shortName)}
                  <ChevronRight size={12} />
                </button>
              </div>
            )}
            {opens && opens !== level && (
              <button
                className="open-component"
                onClick={() => onDive(selected.id)}
              >
                继续拆解 {zh(levels[opens].name)}
                <ChevronRight size={17} />
              </button>
            )}
            <div className="detail-actions">
              <button onClick={onIsolate}>
                <Focus size={14} />
                {isolated ? "恢复周围部件" : "单独查看"}
              </button>
              <button onClick={onFocus}>
                <Maximize size={14} />
                聚焦
              </button>
              <button onClick={() => onHide(selected.id)}>
                <EyeOff size={14} />
                隐藏
              </button>
            </div>
            <p className="accuracy">{selected.physicalAccuracy}</p>
            {selected.sources.length > 0 && (
              <div className="source-links">
                <h3>资料与架构来源</h3>
                <p>
                  制造商资料与标准解释部件原理；示意模型不是产品工程图。
                </p>
                {selected.sources.map((s) => (
                  <a
                    key={s}
                    href={sources[s].url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {zh(sources[s].name)}
                    <ArrowUpRight size={12} />
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
