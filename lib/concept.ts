import type { LevelId } from './levels.ts';
import type { SourceId } from './sources.ts';
import {zh,chineseExplanation} from './chinese.ts';

/**
 * Systems a component can belong to. These drive the visibility toggles and
 * the colour a piece is tinted, so they are coarse on purpose: a viewer should
 * be able to hide "everything to do with power" in one click.
 */
export const categories = [
  'Chassis',
  'Cooling',
  'Board',
  'Power',
  'Memory',
  'Storage',
  'Compute',
  'Graphics',
] as const;
export type Category = (typeof categories)[number];

export const colors: Record<Category, string> = {
  Chassis: '#a39a91',
  Cooling: '#9caebd',
  Board: '#8faaa0',
  Power: '#dca369',
  Memory: '#64adbf',
  Storage: '#6cbfa4',
  Compute: '#709fcb',
  Graphics: '#b497cf',
};

export interface Concept {
  english?: {name:string;description:string;purpose:string};
  id: string;
  name: string;
  shortName: string;
  category: Category;
  parent: string | null;
  children: string[];
  description: string;
  purpose: string;
  quantity: string;
  specifications: Record<string, string>;
  representationType: 'physical' | 'logical';
  physicalAccuracy: string;
  sources: SourceId[];
  searchTerms: string[];
  /** The scale this concept is rendered at. */
  level: LevelId;
  /** Set when selecting this component can descend into a scale of its own. */
  open?: LevelId;
  /**
   * An outer cover that has to come off before anything behind it can move:
   * a glass or mesh panel, the lid, a dust filter. These leave at the start of
   * the disassembly, ahead of everything else, because a fan that sets off
   * forward while the panel in front of it is still shut goes through the
   * panel.
   */
  opensFirst?: boolean;
}

export const physical =
  '结构示意：外形、布局和机械数量为近似表达，不作为电路板布局或维修尺寸模型。';
export const logical =
  '原理示意：依据公开架构资料，方块大小和位置用于解释，不代表真实晶体管布局。';
export const standard =
  '标准结构：参照公开外形规格，器件配置和走线具有代表性，不是某个产品的完整工程复刻。';

export type Entry = Omit<
  Concept,
  'children' | 'physicalAccuracy' | 'sources' | 'shortName' | 'searchTerms'
> &
  Partial<
    Pick<
      Concept,
      'children' | 'physicalAccuracy' | 'sources' | 'shortName' | 'searchTerms'
    >
  >;

export function concept(c: Entry): Concept {
  const [description,purpose]=chineseExplanation(c.name,c.representationType==='logical');
  return {
    ...c,
    english: {name:c.name,description:c.description,purpose:c.purpose},
    name:zh(c.name),
    description,
    purpose,
    children: c.children ?? [],
    shortName: zh(c.shortName ?? c.name) === (c.shortName ?? c.name) ? zh(c.name) : zh(c.shortName ?? c.name),
    physicalAccuracy:
      c.physicalAccuracy ??
      (c.representationType === 'physical' ? physical : logical),
    sources: c.sources ?? [
      c.representationType === 'physical' ? 'specs' : 'whitepaper',
    ],
    searchTerms: [...(c.searchTerms ?? []),c.name,c.shortName??c.name],
  };
}
