import { writeFile } from 'node:fs/promises';
import { lessons } from '../lib/learning-courses.ts';
const escape = (text) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
const html = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>中文硬件入门指南 · 电脑构造实验室</title><style>body{font:15px/1.9 'Segoe UI','Microsoft YaHei',sans-serif;color:#32483b;background:#f4f6ee;max-width:900px;margin:auto;padding:32px 24px}a{color:#b7714b}header{border-bottom:1px solid #dce3d1;padding:15px 0 25px}h1{font-size:30px}h2{font-size:23px;margin:0 0 15px}h3{font-size:16px;margin:16px 0 3px}section{background:#fcfdf7;padding:28px;margin:22px 0;border:1px solid #dfe6d5;border-radius:12px}p{margin:8px 0;color:#6d7d62}.kicker{font-size:12px;color:#91a17f;letter-spacing:.15em}nav{display:flex;flex-wrap:wrap;gap:8px 17px}footer{font-size:12px;color:#91a17f;padding:20px 0}button{font:inherit}</style><header><a href="/">← 返回 3D 学习空间</a><p class="kicker">COMPUTER LAB / 中文硬件指南</p><h1>理解零件，也理解它们如何协作。</h1><p>本指南与十章课程使用同一份教学内容。每章先观察，再通过小游戏练习，最后完成两种机型的组装。</p><nav>${lessons.map((l) => `<a href="#chapter-${l.id}">${l.id}. ${escape(l.subtitle)}</a>`).join('')}</nav></header>${lessons.map((l) => `<section id="chapter-${l.id}"><p class="kicker">第 ${l.id} 章 · ${l.machine === 'desktop' ? '台式机' : '笔记本'}</p><h2>${escape(l.subtitle)}</h2><p>${escape(l.description)}</p>${l.points.map(([title, text]) => `<h3>${escape(title)}</h3><p>${escape(text)}</p>`).join('')}<p><a href="${escape(l.reference)}" target="_blank" rel="noreferrer">本章参考资料 ↗</a></p></section>`).join('')}<section id="smoother-3d"><h2>让 3D 观察更流畅</h2><p>先使用“轻量画质”，关闭不用的浏览器标签页。支持硬件加速的浏览器可在设置中开启图形加速，再重启浏览器。首轮模型构建与切换时会有短暂等待。</p><p>学习进度保存在浏览器本地。清除网站数据或更换浏览器会改变可读取的进度；同一电脑上的不同端口也属于不同的网站来源。</p></section><footer>基于 PC Anatomy（MIT）制作的中文教学扩展。实体结构与原理示意分别呈现，英文原文与参考规格保留供对照。</footer></html>`;
await writeFile('public/guide/index.html', html.replace('href="/"', 'href="../"'));
console.log('中文硬件指南已由课程数据生成。');
