'use client';
import {zh} from '@/lib/chinese';
import { useRef, type RefObject } from 'react';
import { X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  comparisonItem,
  comparisonRows,
  sharesSpecTable,
  type ComparisonItem,
  type ComparisonLevel,
} from '@/lib/comparison-state';
import { byId } from '@/lib/manifest';
import { levels } from '@/lib/levels';
import { sources } from '@/lib/sources';

type Props = {
  left: ComparisonLevel;
  right: ComparisonLevel;
  open: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onOpenChange: (open: boolean) => void;
};

type Pair = readonly [ComparisonItem, ComparisonItem];
const letters = ['A', 'B'] as const;

function SpecValue({ value }: { value: string | null }) {
  return value ?? <span className="spec-unlisted">未列出</span>;
}

/** Like parts: one row per field label, gaps left visible. */
function SpecTable({ pair }: { pair: Pair }) {
  const [left, right] = pair;
  const rows = comparisonRows(left.level, right.level);
  return (
    <>
      <table className="comparison-specs-grid">
        <thead>
          <tr className="spec-row spec-head">
            <th scope="col">规格</th>
            <th scope="col">A · {zh(left.shortName)}</th>
            <th scope="col">B · {zh(right.shortName)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const different = Boolean(
              row.left && row.right && row.left !== row.right,
            );
            return (
              <tr
                className="spec-row"
                key={row.id}
                data-different={different || undefined}
              >
                <th scope="row">{zh(row.label)}</th>
                <td>
                  <SpecValue value={row.left} />
                </td>
                <td>
                  <SpecValue value={row.right} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <p className="comparison-specs-note">
          目录未列出这些模型的规格。
        </p>
      )}
    </>
  );
}

/** Unlike parts: each model's own fields, with no forced alignment. */
function SpecCards({ pair }: { pair: Pair }) {
  return (
    <div className="comparison-independent-specs">
      {pair.map((item, index) => (
        <section className="comparison-spec-card" key={item.level}>
          <h3>
            {letters[index]} · {zh(item.name)}
          </h3>
          <p>
            {zh(levels[item.system].name)} ·{' '}
            {item.kind === 'physical' ? "实体硬件" : "架构图解"}
          </p>
          <dl>
            {item.specs.map((spec) => (
              <div key={spec.id}>
                <dt>{zh(spec.label)}</dt>
                <dd>{spec.value}</dd>
              </div>
            ))}
          </dl>
          {!item.specs.length && (
            <p>目录未列出此模型的规格。</p>
          )}
        </section>
      ))}
    </div>
  );
}

/** Each model's modelling-accuracy note and cited sources. */
function SourceNotes({ pair }: { pair: Pair }) {
  return (
    <div className="comparison-source-notes">
      {pair.map((item, index) => {
        const concept = byId[levels[item.level].concept];
        return (
          <section key={item.level}>
            <h3>
              {letters[index]} · {zh(item.shortName)}
            </h3>
            <p>{concept.physicalAccuracy}</p>
            <ul>
              {concept.sources.map((id) => (
                <li key={id}>
                  <a href={sources[id].url} target="_blank" rel="noreferrer">
                    {zh(sources[id].name)}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export default function ComparisonSpecs({
  left,
  right,
  open,
  returnFocusRef,
  onOpenChange,
}: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const pair: Pair = [comparisonItem(left), comparisonItem(right)];
  const aligned = sharesSpecTable(left, right);
  return (
    <Sheet open={open} modal={false} onOpenChange={onOpenChange}>
      <SheetContent
        className="comparison-specs"
        side="right"
        showCloseButton={false}
        initialFocus={closeButton}
        finalFocus={returnFocusRef}
      >
        <div className="comparison-specs-heading">
          <div>
            <SheetTitle>规格对比</SheetTitle>
            <SheetDescription>
              {aligned
                ? "相同字段对齐；未列出表示目录未记录该项参数。"
                : "不同类别部件，各自显示自身规格。"}
            </SheetDescription>
          </div>
          <button
            ref={closeButton}
            aria-label="关闭规格对比"
            onClick={() => onOpenChange(false)}
          >
            <X size={18} />
          </button>
        </div>
        {aligned ? <SpecTable pair={pair} /> : <SpecCards pair={pair} />}
        <SourceNotes pair={pair} />
      </SheetContent>
    </Sheet>
  );
}
