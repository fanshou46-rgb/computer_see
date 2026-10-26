'use client';
import { Code2, Cpu, Info, Layers3, Search } from 'lucide-react';
import { GUIDE, REPOSITORY } from './links';

type Props = {
  layers: boolean;
  onReset: () => void;
  onToggleLayers: () => void;
  onSearch: () => void;
  onAbout: () => void;
};

export default function Topbar({
  layers,
  onReset,
  onToggleLayers,
  onSearch,
  onAbout,
}: Props) {
  return (
    <header className="topbar">
      <button className="brand" onClick={onReset} aria-label="复位探索空间">
        <span className="brand-icon">
          <Cpu size={21} />
        </span>
        <span>PC Anatomy</span>
      </button>
      <a
        className="byline"
        href={REPOSITORY}
        target="_blank"
        rel="noreferrer"
        title="PC Anatomy 的 GitHub 项目"
      >
        <Code2 size={13} />
        <span className="byline-text">
          <span className="byline-prefix">原作者 </span>
          <strong>Yoseph</strong>
        </span>
      </a>
      <div className="header-actions">
        <a
          className="guide-link"
          href={GUIDE}
          title="认识电脑部件"
        >
          硬件指南
        </a>
        <button
          className="mobile-layers"
          onClick={onToggleLayers}
          aria-label="打开或关闭部件目录"
          aria-expanded={layers}
        >
          <Layers3 size={19} />
        </button>
        <button
          className="search-button"
          aria-label="搜索部件"
          onClick={onSearch}
        >
          <Search size={16} />
          <span>搜索部件</span>
          <kbd>/</kbd>
        </button>
        <button
          className="info-button"
          aria-label="关于与来源"
          onClick={onAbout}
        >
          <Info size={19} />
        </button>
      </div>
    </header>
  );
}
