'use client';
import {zh} from '@/lib/chinese';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
} from '@/components/ui/command';
import { byId, colors, searchConcepts } from '@/lib/manifest';
import { levels } from '@/lib/levels';

/** What the palette offers before anything has been typed. */
const suggested = [
  'package',
  'gddr7',
  'gpc',
  'sm',
  'tensor',
  'rt',
  'l2',
  'vrm',
];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
};

export default function SearchDialog({
  open,
  onOpenChange,
  query,
  onQueryChange,
  onSelect,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="search-dialog">
        <DialogTitle>搜索部件</DialogTitle>
        <DialogDescription>
          搜索硬件或架构，进入对应层级。
        </DialogDescription>
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={onQueryChange}
            placeholder="试试“内存”“张量核心”“L2”或“SM”…"
          />
          <CommandList>
            <CommandEmpty>
              未找到部件，可以试试“内存”或“CUDA”。
            </CommandEmpty>
            <CommandGroup
              heading={query ? "相同结构" : "探索当前部件"}
            >
              {(query
                ? searchConcepts(query)
                : suggested.map((id) => byId[id])
              ).map((c) => (
                <CommandItem
                  key={c.id}
                  value={c.id}
                  onSelect={() => onSelect(c.id)}
                >
                  <i style={{ background: colors[c.category] }} />
                  <div>
                    {zh(c.name)}
                    <small>
                      <span>{zh(levels[c.level].name)}</span>
                      {zh(c.category)} ·{' '}
                      {c.representationType === 'logical'
                        ? "逻辑架构"
                        : "实体硬件"}
                    </small>
                  </div>
                  <ArrowUpRight size={15} />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="search-hint">
          ↑ ↓ 浏览 <span>回车查看</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
