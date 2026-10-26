'use client';
import {zh} from '@/lib/chinese';
import { useCallback, useMemo, useRef, useState, type RefObject } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  ChevronDown,
  Cpu,
} from 'lucide-react';
import {
  canComparePhysicalScale,
  comparisonItem,
  createComparisonState,
  selectComparisonItem,
  setComparisonActiveSide,
  setComparisonExplode,
  setComparisonFraming,
  setComparisonSpecsOpen,
  otherSide,
  sideLetter,
  swapComparisonSides,
  type ComparisonFraming,
  type ComparisonItem,
  type ComparisonLevel,
  type ComparisonSide,
  type ComparisonViewState,
} from '@/lib/comparison-state';
import ComparisonPicker from './comparison-picker';
import ComparisonViewer from './comparison-viewer';
import ComparisonSpecs from './comparison-specs';
import Disassembly from './disassembly';
import { useDisassemblyPlayback } from './use-disassembly-playback';
import './comparison.css';

type Props = { initialLevel: ComparisonLevel; onExit: () => void };

function framingNote(framing: ComparisonFraming, trueSizeAvailable: boolean) {
  if (framing === 'scale') return "两侧使用相同物理比例。";
  return trueSizeAvailable
    ? "分别适配视口，大小不可直接比较。"
    : "分别适配视口；原理图不表示物理比例。";
}

function disassemblyTitle(left: ComparisonItem, right: ComparisonItem) {
  if (left.kind !== right.kind) return "探索两侧";
  return left.kind === 'logical' ? "同时展开" : "同时拆解";
}

type PartSelectorProps = {
  side: ComparisonSide;
  item: ComparisonItem;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
};

/** The card above each pane; it opens that side's picker. */
function PartSelector({ side, item, buttonRef, onOpen }: PartSelectorProps) {
  return (
    <button
      className={`comparison-selector ${side}`}
      ref={buttonRef}
      aria-label={`Choose part ${sideLetter(side)}`}
      aria-haspopup="dialog"
      onClick={onOpen}
    >
      <span className="comparison-letter">{sideLetter(side)}</span>
      <span className="comparison-selected-part">
        <strong>{zh(item.shortName)}</strong>
      </span>
      <ChevronDown size={17} aria-hidden="true" />
    </button>
  );
}

export default function ComparisonWorkbench({ initialLevel, onExit }: Props) {
  const specsButton = useRef<HTMLButtonElement>(null);
  const selectorButtons = {
    left: useRef<HTMLButtonElement>(null),
    right: useRef<HTMLButtonElement>(null),
  };
  const [state, setState] = useState(() => createComparisonState(initialLevel));
  const [picker, setPicker] = useState<ComparisonSide | null>(null);
  const [viewerRevision, setViewerRevision] = useState(0);
  const updateExplode = useCallback(
    (explode: number) =>
      setState((current) => setComparisonExplode(current, explode)),
    [],
  );
  const {
    playing,
    setExplode,
    stop: stopDisassembly,
    toggleAuto,
  } = useDisassemblyPlayback(state.explode, updateExplode);
  const viewerState = useMemo<ComparisonViewState>(
    () => ({
      left: state.left,
      right: state.right,
      activeSide: state.activeSide,
      explode: state.explode,
      framing: state.framing,
    }),
    [state.activeSide, state.explode, state.framing, state.left, state.right],
  );
  const leftItem = comparisonItem(state.left);
  const rightItem = comparisonItem(state.right);
  const trueSizeAvailable = canComparePhysicalScale(state.left, state.right);
  const logical = leftItem.kind === 'logical' && rightItem.kind === 'logical';
  const reset = () => {
    stopDisassembly();
    setState((current) => ({ ...current, explode: 0 }));
    setViewerRevision((revision) => revision + 1);
  };
  const choose = (level: ComparisonLevel) => {
    if (!picker) return;
    stopDisassembly();
    setState((current) => selectComparisonItem(current, picker, level));
    setPicker(null);
  };
  const openPicker = (side: ComparisonSide) => {
    stopDisassembly();
    setPicker(side);
  };
  const selector = (side: ComparisonSide) => (
    <PartSelector
      side={side}
      item={side === 'left' ? leftItem : rightItem}
      buttonRef={selectorButtons[side]}
      onOpen={() => openPicker(side)}
    />
  );
  return (
    <main
      className="workbench comparison-workbench"
      data-active-side={state.activeSide}
    >
      <header className="comparison-topbar">
        <a className="comparison-brand" href="/" aria-label="PC Anatomy">
          <Cpu size={20} aria-hidden="true" />
          <strong>PC Anatomy</strong>
        </a>
        <div className="comparison-top-actions">
          <button
            ref={specsButton}
            className="comparison-specs-button"
            aria-label="规格"
            onClick={() =>
              setState((current) => setComparisonSpecsOpen(current, true))
            }
          >
            <BarChart3 size={16} />
            <span>规格</span>
          </button>
          <button
            className="comparison-exit"
            onClick={onExit}
            aria-label="返回探索"
          >
            <ChevronLeft size={17} />
            <span>返回探索</span>
          </button>
        </div>
      </header>
      <section className="comparison-setup" aria-label="对比组合">
        <div className="comparison-pair">
          {selector('left')}
          <button
            className="comparison-swap"
            onClick={() => setState(swapComparisonSides)}
            aria-label="交换对比位置"
          >
            <ArrowLeftRight size={18} />
          </button>
          {selector('right')}
        </div>
        <div className="comparison-framing">
          <fieldset aria-label="模型比例">
            <button
              aria-pressed={state.framing === 'fit'}
              onClick={() =>
                setState((current) => setComparisonFraming(current, 'fit'))
              }
            >
              分别适配
            </button>
            <button
              aria-pressed={state.framing === 'scale'}
              disabled={!trueSizeAvailable}
              aria-describedby="comparison-scale-note"
              onClick={() =>
                setState((current) => setComparisonFraming(current, 'scale'))
              }
            >
              真实比例
            </button>
          </fieldset>
          <p id="comparison-scale-note">
            {framingNote(state.framing, trueSizeAvailable)}
          </p>
        </div>
      </section>
      <fieldset
        className="comparison-mobile-switch"
        aria-label="当前显示的对比侧"
      >
        {(['left', 'right'] as const).map((side) => (
          <button
            key={side}
            aria-pressed={state.activeSide === side}
            onClick={() =>
              setState((current) => setComparisonActiveSide(current, side))
            }
          >
            {side === 'left' ? 'A · Left' : 'B · Right'}
          </button>
        ))}
      </fieldset>
      <div className="comparison-divider" aria-hidden="true" />
      <ComparisonViewer key={viewerRevision} state={viewerState} />
      <div className="sr-only" aria-live="polite">
        正在对比 {zh(leftItem.name)} 包含 {zh(rightItem.name)}.
      </div>
      <Disassembly
        level={state.left}
        explode={state.explode}
        logical={logical}
        playing={playing}
        onToggleAuto={toggleAuto}
        onSetExplode={setExplode}
        onReset={reset}
        sectionLabel="共用拆解控制"
        title={disassemblyTitle(leftItem, rightItem)}
        sliderLabel="拆解或展开两个模型"
        valueText={`${Math.round(state.explode)} percent for both models`}
      />
      <ComparisonSpecs
        left={state.left}
        right={state.right}
        open={state.specsOpen}
        returnFocusRef={specsButton}
        onOpenChange={(open) =>
          setState((current) => setComparisonSpecsOpen(current, open))
        }
      />
      {picker && (
        <ComparisonPicker
          key={`${picker}:${state[picker]}`}
          side={picker}
          selected={state[picker]}
          other={state[otherSide(picker)]}
          returnFocusRef={selectorButtons[picker]}
          onChoose={choose}
          onClose={() => setPicker(null)}
        />
      )}
    </main>
  );
}
