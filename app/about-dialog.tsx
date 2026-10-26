'use client';
import {zh} from '@/lib/chinese';
import { ArrowUpRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { sources } from '@/lib/manifest';
import { GUIDE, GUIDE_ACCELERATION, REPOSITORY } from './links';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export default function AboutDialog({ open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal>
      <DialogContent className="about-dialog">
        <DialogTitle>从机箱一直探索到计算核心。</DialogTitle>
        <DialogDescription>
          本地中文教学扩展基于 PC Anatomy，保留原作者和 MIT 许可证。
          你可以观察硬件、学习作用与组成，再通过课程完成组装。
        </DialogDescription>
        <p>
          自由探索从整台电脑逐层进入主板、显卡、内存与芯片架构。
          教学组装使用独立的操作规则，展开模型不会自动完成课程。
        </p>
        <h3>实体结构与原理示意</h3>
        <p>
          <strong>实体硬件</strong> 展示机械结构和相对位置。部分外形遵循公开规格，
          内部布局仍含教学性简化。教学笔记本另行建模，不把原有游戏本改名使用。
        </p>
        <p>
          <strong>芯片原理图</strong> 解释公开架构中的功能关系，方块的位置和大小不代表
          制造版图。封装、焊接元件与内部逻辑不属于用户可直接拔下的装机件。
        </p>
        <h3>资料与致谢</h3>
        <a className="about-source" href={GUIDE_ACCELERATION}>
          浏览器硬件加速设置 <ArrowUpRight size={15} />
        </a>
        <a className="about-source" href={GUIDE}>
          电脑部件中文入门指南
          <ArrowUpRight size={15} />
        </a>
        {Object.entries(sources)
          .slice(0, 2)
          .map(([id, s]) => (
            <a
              className="about-source"
              key={id}
              href={s.url}
              target="_blank"
              rel="noreferrer"
            >
              {zh(s.name)}
              <ArrowUpRight size={15} />
            </a>
          ))}
        <a
          className="about-source"
          href="https://github.com/ashemag/human-atlas"
          target="_blank"
          rel="noreferrer"
        >
          交互参考 · Human Atlas
          <ArrowUpRight size={15} />
        </a>
        <a
          className="about-source"
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
        >
          PC Anatomy 源码
          <ArrowUpRight size={15} />
        </a>
        <p className="about-foot">
          原项目独立于 NVIDIA、AMD 与 Intel。模型由代码生成，保留原项目资料来源。
        </p>
      </DialogContent>
    </Dialog>
  );
}
