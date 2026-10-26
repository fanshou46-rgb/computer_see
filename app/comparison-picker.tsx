'use client';
import {zh} from '@/lib/chinese';
import { useMemo, useRef, useState, type RefObject } from 'react';
import { Check, Search, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  comparisonCategories,
  comparisonItem,
  comparisonItemPath,
  filterComparisonItems,
  otherSide,
  sideLetter,
  type ComparisonCategoryId,
  type ComparisonItem,
  type ComparisonLevel,
  type ComparisonSide,
} from '@/lib/comparison-state';
import { levels, systemRoots } from '@/lib/levels';

type Props = {
  side: ComparisonSide;
  selected: ComparisonLevel;
  other: ComparisonLevel;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onChoose: (level: ComparisonLevel) => void;
  onClose: () => void;
};

type ResultProps = {
  item: ComparisonItem;
  selected: boolean;
  /** Set when the other side already shows this model. */
  takenBy: string | null;
  onChoose: () => void;
};

function PickerResult({ item, selected, takenBy, onChoose }: ResultProps) {
  return (
    <li>
      <button
        data-level={item.level}
        disabled={takenBy !== null}
        aria-pressed={selected}
        onClick={onChoose}
      >
        <span className="comparison-result-copy">
          <strong>{zh(item.name)}</strong>
          <small>{comparisonItemPath(item)}</small>
          <span>{item.note}</span>
        </span>
        <span className="comparison-result-kind">
          {takenBy
            ? `On ${takenBy}`
            : item.kind === 'logical'
              ? "原理图"
              : "实体硬件"}
        </span>
        {selected && <Check size={16} aria-label="已选中" />}
      </button>
    </li>
  );
}

/**
 * Category, system and search filters combine. The counts beside each
 * category follow the system and search filters, so a reader can see where
 * the matches are before switching category.
 */
export default function ComparisonPicker({
  side,
  selected,
  other,
  returnFocusRef,
  onChoose,
  onClose,
}: Props) {
  const search = useRef<HTMLInputElement>(null);
  // Open on the current part's category; "All parts" is one click away.
  const [category, setCategory] = useState<ComparisonCategoryId | undefined>(
    comparisonItem(selected).category,
  );
  const [system, setSystem] = useState<ComparisonLevel | undefined>();
  const [query, setQuery] = useState('');
  const matches = useMemo(
    () => filterComparisonItems({ system, query }),
    [system, query],
  );
  const countIn = (id: ComparisonCategoryId) =>
    matches.filter((item) => item.category === id).length;
  const results = category
    ? matches.filter((item) => item.category === category)
    : matches;
  const groups = comparisonCategories
    .map((entry) => ({
      ...entry,
      items: results.filter((item) => item.category === entry.id),
    }))
    .filter((entry) => entry.items.length);
  const clear = () => {
    setCategory(undefined);
    setSystem(undefined);
    setQuery('');
    search.current?.focus();
  };
  const otherLetter = sideLetter(otherSide(side));
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className="comparison-picker"
        showCloseButton={false}
        initialFocus={search}
        finalFocus={returnFocusRef}
      >
        <header className="comparison-picker-heading">
          <div>
            <DialogTitle>选择部件 {sideLetter(side)}</DialogTitle>
            <DialogDescription>
              选择任意机型，另一侧保持不变。
            </DialogDescription>
          </div>
          <button aria-label="关闭部件选择" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <div className="comparison-picker-filters">
          <label className="comparison-search">
            <Search size={17} aria-hidden="true" />
            <input
              ref={search}
              aria-label="搜索零件"
              placeholder="搜索零件、型号或架构…"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <label className="comparison-system-filter">
            <span>机型</span>
            <select
              aria-label="机型"
              value={system ?? 'all'}
              onChange={(event) =>
                setSystem(
                  event.target.value === 'all'
                    ? undefined
                    : (event.target.value as ComparisonLevel),
                )
              }
            >
              <option value="all">全部机型</option>
              {systemRoots.map((root) => (
                <option key={root} value={root}>
                  {zh(levels[root].name)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="comparison-picker-body">
          <nav className="comparison-category-nav" aria-label="部件分类">
            <button
              aria-pressed={!category}
              onClick={() => setCategory(undefined)}
            >
              全部部件 <span aria-hidden="true">{matches.length}</span>
            </button>
            {comparisonCategories.map((entry) => (
              <button
                key={entry.id}
                aria-pressed={category === entry.id}
                onClick={() => setCategory(entry.id)}
              >
                {zh(entry.label)}
                <span aria-hidden="true">{countIn(entry.id)}</span>
              </button>
            ))}
          </nav>
          <div className="comparison-results">
            <output className="comparison-result-count">
              {results.length} {results.length === 1 ? 'part' : 'parts'}
            </output>
            {!results.length && (
              <div className="comparison-empty">
                <strong>未找到部件</strong>
                <p>请更换分类、机型或搜索词。</p>
                <button onClick={clear}>清除筛选</button>
              </div>
            )}
            {groups.map((group) => (
              <section key={group.id} aria-label={group.label}>
                <h3>{zh(group.label)}</h3>
                <ul>
                  {group.items.map((item) => (
                    <PickerResult
                      key={item.level}
                      item={item}
                      selected={item.level === selected}
                      takenBy={item.level === other ? otherLetter : null}
                      onChoose={() => onChoose(item.level)}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
