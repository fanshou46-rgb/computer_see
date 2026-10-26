import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  CircuitBoard,
  Cpu,
  Expand,
  GraduationCap,
  HardDrive,
  Layers3,
  Lightbulb,
  LockKeyhole,
  MemoryStick,
  Monitor,
  MousePointer2,
  NotebookPen,
  Play,
  RotateCcw,
  RotateCw,
  Search,
  Sparkles,
  Trophy,
  Undo2,
  Volume2,
  Wrench,
  Zap,
} from 'lucide-react';
import LearningCanvas from './learning-canvas';
import type { InteractionMode } from '@/lib/learning-interaction';
import {
  lessons,
  observationAssembly,
  practiceAssembly,
} from '@/lib/learning-courses';
import {
  applyAction,
  completion,
  makeAssembly,
  nextAction,
  operationNames,
  partComplete,
  partFor,
  partsFor,
  startupCheck,
  type Action,
  type AssemblyState,
  type Machine,
  type Operation,
  type Result,
} from '@/lib/learning-rules';
import {
  freshProgress,
  restoreProgress,
  SAVE_KEY,
  type Progress,
} from '@/lib/learning-progress';
import './learning.css';
const Explorer = lazy(() => import('./page'));
const icons = [
  CircuitBoard,
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  Layers3,
  Zap,
  Trophy,
  NotebookPen,
  Trophy,
];
const stepLabels = {
  learn: '认识与观察',
  quiz: '知识小游戏',
  practice: '动手练习',
  summary: '学习小结',
};
const load = () => {
  try {
    return restoreProgress(localStorage.getItem(SAVE_KEY));
  } catch {
    return { progress: freshProgress(), recovered: false };
  }
};

export default function LearningApp() {
  const [initial] = useState(load),
    [progress, setProgress] = useState<Progress>(initial.progress);
  const [mode, setMode] = useState<'learn' | 'explore' | 'library'>(() =>
    new URLSearchParams(location.search).has('scale') ? 'explore' : 'learn',
  );
  const [selected, setSelected] = useState('board'),
    [expanded, setExpanded] = useState(false),
    [quality, setQuality] = useState('standard');
  const [interaction, setInteraction] = useState<InteractionMode>('inspect');
  const [notice, setNotice] = useState(
      initial.recovered ? '已恢复可读取的学习进度，当前场景已安全重置。' : '',
    ),
    [saveError, setSaveError] = useState(false);
  const [choice, setChoice] = useState<string | null>(null),
    [answered, setAnswered] = useState(false),
    [hint, setHint] = useState(0);
  const [history, setHistory] = useState<
      { assembly: AssemblyState; removed: string[] }[]
    >([]),
    [ports, setPorts] = useState<Record<string, string>>({});
  const [demo, setDemo] = useState<{ state: AssemblyState; id: string } | null>(
      null,
    ),
    [boot, setBoot] = useState<'off' | 'running' | 'success'>('off');
  const [libraryMachine, setLibraryMachine] = useState<Machine>('desktop'),
    [search, setSearch] = useState('');
  const demoTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    bootTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lesson = lessons[progress.lesson - 1],
    isFinal = lesson.id === 8 || lesson.id === 10;
  const question =
    lesson.questions[
      Math.min(progress.question, Math.max(lesson.questions.length - 1, 0))
    ];
  const observation = useMemo(() => observationAssembly(lesson), [lesson]);
  const libraryState = useMemo(() => {
    const s = makeAssembly(libraryMachine, true);
    s.parts.panel.installed = false;
    s.parts.panel.fixed = false;
    return s;
  }, [libraryMachine]);
  const state =
    mode === 'library'
      ? libraryState
      : progress.step === 'practice'
        ? (progress.assembly ?? practiceAssembly(lesson))
        : observation;
  const canvasState = demo?.state ?? state;
  const machine = state.machine,
    parts = partsFor(machine),
    part = partFor(machine, selected) ?? parts[0],
    partState = state.parts[part.id];
  const removePhase =
    progress.step === 'practice' &&
    [3, 9].includes(lesson.id) &&
    lesson.practice.some((id) => !progress.removed.includes(id));
  const goalComplete =
    progress.step === 'practice' &&
    (isFinal
      ? completion(state).done === completion(state).total
      : lesson.practice.every((id) =>
          partComplete(state, partFor(machine, id)!),
        ) && !removePhase);
  const unlocked = Math.min(progress.completed.length + 1, 10);

  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(progress));
      queueMicrotask(() => setSaveError(false));
    } catch {
      queueMicrotask(() => setSaveError(true));
    }
  }, [progress]);
  useEffect(() => {
    if (mode !== 'explore') document.title = '电脑构造实验室 · 学习与组装';
  }, [mode]);
  useEffect(
    () => () => {
      if (demoTimer.current) clearTimeout(demoTimer.current);
      if (bootTimer.current) clearTimeout(bootTimer.current);
    },
    [],
  );
  const notify = (message: string) => setNotice(message);
  function clearTransient() {
    setInteraction('inspect');
    setHint(0);
    setChoice(null);
    setAnswered(false);
    setHistory([]);
    setBoot('off');
    setDemo(null);
    setExpanded(false);
    if (demoTimer.current) clearTimeout(demoTimer.current);
    if (bootTimer.current) clearTimeout(bootTimer.current);
  }
  function selectLesson(id: number) {
    if (id > unlocked) return;
    clearTransient();
    setMode('learn');
    setSelected(lessons[id - 1].focus);
    setNotice('');
    setProgress((p) => ({
      ...p,
      lesson: id,
      step: 'learn',
      question: 0,
      assembly: null,
      removed: [],
    }));
  }
  function startPractice() {
    clearTransient();
    setSelected(lesson.focus);
    setProgress((p) => ({
      ...p,
      step: 'practice',
      assembly: practiceAssembly(lesson),
      removed: [],
    }));
    setNotice(
      [3, 9].includes(lesson.id)
        ? '先完成拆卸，再亲手装回。所有操作都可以撤销。'
        : '从托盘选择部件，完成就位、固定和连接。',
    );
  }
  function begin() {
    if (!lesson.questions.length) {
      startPractice();
      return;
    }
    setProgress((p) => ({ ...p, step: 'quiz', question: 0 }));
    setHint(0);
    setNotice('');
    setChoice(null);
    setAnswered(false);
  }
  function checkAnswer(id: string) {
    if (!question || answered) return;
    setChoice(id);
    if (id === question.answer) {
      setAnswered(true);
      setNotice('回答正确！' + question.explanation);
    } else setNotice('再想一想。' + question.explanation);
  }
  function onPick(id: string) {
    setSelected(id);
    if (
      mode === 'learn' &&
      progress.step === 'quiz' &&
      question?.kind === 'find' &&
      !answered
    ) {
      if (id === question.target) checkAnswer(question.answer);
      else
        setNotice(
          `你选中了${partFor(machine, id)?.name ?? id}。请根据外观和位置再找一找。`,
        );
    }
  }
  function perform(action: Action): Result {
    if (demo) return { ok: false, state, message: '示范结束后再操作。' };
    if (mode !== 'learn' || progress.step !== 'practice') {
      onPick(action.part);
      setNotice('当前为观察模式。进入动手练习后，操作才会计入关卡。');
      return {
        ok: false,
        state,
        message: '当前为观察模式。进入动手练习后再操作。',
      };
    }
    const result = applyAction(state, action);
    setNotice(result.message);
    if (!result.ok) return result;
    setHistory((h) => [
      ...h.slice(-29),
      { assembly: structuredClone(state), removed: [...progress.removed] },
    ]);
    setProgress((p) => ({
      ...p,
      assembly: result.state,
      removed: ['remove', 'disconnect'].includes(action.type)
        ? [...new Set([...p.removed, action.part])]
        : p.removed,
    }));
    setBoot('off');
    return result;
  }
  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setProgress((p) => ({
      ...p,
      assembly: previous.assembly,
      removed: previous.removed,
    }));
    setHistory((h) => h.slice(0, -1));
    setBoot('off');
    setNotice('已撤销上一步操作。');
  }
  function suggested(id = part.id): Action | null {
    const p = partFor(machine, id)!,
      v = state.parts[id];
    if (removePhase && !progress.removed.includes(id)) {
      if (v.locked) return { type: 'unlock', part: id };
      if (p.kind === 'cable') return { type: 'disconnect', part: id };
      if (v.fixed) return { type: 'loosen', part: id };
      return { type: 'remove', part: id };
    }
    return nextAction(state, id);
  }
  function showHint() {
    const level = Math.min(hint + 1, 3);
    setHint(level);
    if (progress.step === 'quiz') {
      setSelected(question?.target ?? lesson.focus);
      setNotice(
        level === 1
          ? '提示：' + (question?.explanation ?? lesson.description)
          : level === 2
            ? '已标出相关部件；观察右侧解释，再选择答案。'
            : '示范说明：' + question?.explanation + ' 现在请你作答。',
      );
      return;
    }
    const candidates = isFinal
      ? parts.filter((p) => !partComplete(state, p)).map((p) => p.id)
      : lesson.practice.filter((id) =>
          removePhase
            ? !progress.removed.includes(id)
            : !partComplete(state, partFor(machine, id)!),
        );
    const target =
      candidates.find((id) => {
        const action = suggested(id);
        return action && applyAction(state, action).ok;
      }) ?? candidates[0];
    if (!target) {
      setNotice('目标已经完成，检查后继续即可。');
      return;
    }
    setSelected(target);
    const action = suggested(target);
    if (level === 1) {
      setNotice('提示：' + partFor(machine, target)!.description);
      return;
    }
    if (level === 2) {
      setNotice(
        `已选中${partFor(machine, target)!.name}。下一步可以尝试${action ? operationNames[action.type] : '检查安装'}。`,
      );
      return;
    }
    if (action) {
      const result = applyAction(state, action);
      if (result.ok) {
        setDemo({ state: result.state, id: target });
        setNotice(
          `正在示范：${operationNames[action.type]}${partFor(machine, target)!.name}。示范不计入完成。`,
        );
        demoTimer.current = setTimeout(() => {
          setDemo(null);
          setNotice('示范结束，场景已还原。请你亲手完成刚才的步骤。');
        }, 2400);
      } else setNotice('先处理依赖：' + result.message);
    }
  }
  function checkStartup() {
    const result = startupCheck(state);
    if (result.stage !== 'success') {
      setNotice(
        (result.stage === 'post' ? '硬件自检未通过：' : '启动设备检查：') +
          result.issues.join('；'),
      );
      return;
    }
    if (!goalComplete) {
      const missing = parts.find((p) => !partComplete(state, p));
      setNotice(
        `硬件自检与启动盘检查通过。整机练习还需要完成${missing?.name ?? '其余固定和连接'}。`,
      );
      return;
    }
    setBoot('running');
    setNotice('硬件自检通过 → 已找到教学启动盘 → 正在播放启动演示…');
    bootTimer.current = setTimeout(() => setBoot('success'), 1800);
  }
  function summary() {
    setProgress((p) => ({ ...p, step: 'summary' }));
    setNotice('');
    setBoot('off');
  }
  function completeLesson() {
    clearTransient();
    const completed = Array.from(
      new Set([...progress.completed, lesson.id]),
    ).sort((a, b) => a - b);
    const next = Math.min(lesson.id + 1, 10);
    setProgress((p) => ({
      ...p,
      completed,
      lesson: next,
      step: lesson.id === 10 ? 'summary' : 'learn',
      assembly: null,
      removed: [],
      question: 0,
    }));
    setSelected(lessons[next - 1].focus);
    setNotice(
      lesson.id === 10
        ? '全部课程已完成！可以重玩任意章节，或继续自由探索。'
        : '本章已完成，学习进度已经保存。',
    );
  }
  function rotate() {
    if (partState.installed || partState.connected) {
      setNotice('先将部件取下，再调整方向。');
      return;
    }
    if (progress.step !== 'practice') return;
    setHistory((h) => [
      ...h.slice(-29),
      { assembly: structuredClone(state), removed: [...progress.removed] },
    ]);
    const rotated = structuredClone(state);
    rotated.parts[part.id].rotation = partState.rotation === 0 ? 180 : 0;
    setProgress((p) => ({ ...p, assembly: rotated }));
  }
  const changeMode = (next: typeof mode) => {
    setInteraction('inspect');
    if (next !== 'explore') historyReplace();
    setMode(next);
    setDemo(null);
    setNotice('');
    setSelected(next === 'library' ? 'board' : lesson.focus);
  };
  function historyReplace() {
    window.history.replaceState(null, '', location.pathname);
  }
  function openDeep() {
    const scales = [
      'motherboard',
      'ryzen',
      'dimm',
      'nvme',
      'card',
      'cooler',
      'psu',
      'pc',
      'legionmemory',
      'legion',
    ];
    window.history.replaceState(null, '', `?scale=${scales[lesson.id - 1]}`);
    changeMode('explore');
  }

  return (
    <div className="computer-lab">
      <header className="lab-header">
        <button className="lab-brand" onClick={() => changeMode('learn')}>
          <span className="brand-symbol">
            <CircuitBoard size={23} />
          </span>
          <span>
            电脑构造实验室<small>COMPUTER LAB</small>
          </span>
        </button>
        <nav aria-label="主导航">
          <button
            className={mode === 'learn' ? 'active' : ''}
            onClick={() => changeMode('learn')}
          >
            <GraduationCap size={17} />
            学习闯关
          </button>
          <button
            className={mode === 'explore' ? 'active' : ''}
            onClick={() => changeMode('explore')}
          >
            <Box size={17} />
            自由探索
          </button>
          <button
            className={mode === 'library' ? 'active' : ''}
            onClick={() => changeMode('library')}
          >
            <BookOpen size={17} />
            部件百科
          </button>
        </nav>
        <div className="header-meta">
          <span className="local-dot" />
          本地学习<span className="version">v{__APP_VERSION__}</span>
        </div>
      </header>
      {mode === 'explore' ? (
        <div className="original-explorer">
          <div className="explorer-return">
            <button onClick={() => changeMode('learn')}>
              <ArrowLeft size={15} />
              返回课程
            </button>
            <span>自由探索不影响课程进度 · 可进入部件内部观察</span>
          </div>
          <Suspense
            fallback={<p className="explorer-wait">正在打开硬件探索空间…</p>}
          >
            <Explorer />
          </Suspense>
        </div>
      ) : (
        <>
          <aside className="course-rail">
            <div className="rail-intro">
              <span className="eyebrow">你的硬件学习之旅</span>
              <h1>
                从零认识
                <br />
                一台电脑<span>。</span>
              </h1>
              <p>
                看懂每个零件，
                <br />
                亲手让它们一起工作。
              </p>
            </div>
            <div className="course-progress">
              <span>
                学习进度 <b>{progress.completed.length} / 10</b>
              </span>
              <div>
                <i style={{ width: progress.completed.length * 10 + '%' }} />
              </div>
            </div>
            <div className="chapter-list" aria-label="课程章节">
              {lessons.map((l, i) => {
                const Icon = icons[i],
                  done = progress.completed.includes(l.id),
                  locked = l.id > unlocked;
                return (
                  <button
                    key={l.id}
                    disabled={locked}
                    className={
                      (mode === 'learn' && lesson.id === l.id
                        ? 'current '
                        : '') + (done ? 'done' : '')
                    }
                    onClick={() => selectLesson(l.id)}
                    aria-current={lesson.id === l.id ? 'step' : undefined}
                  >
                    <span className="chapter-icon">
                      {done ? <Check size={17} /> : <Icon size={17} />}
                    </span>
                    <span>
                      <small>
                        {String(l.id).padStart(2, '0')} ·{' '}
                        {l.machine === 'desktop' ? '台式机' : '笔记本'}
                      </small>
                      <strong>{l.subtitle}</strong>
                    </span>
                    {locked ? (
                      <LockKeyhole size={13} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="rail-footer">
              <Lightbulb size={18} />
              <span>
                慢慢来，学会比速度更重要。
                <br />
                不限时 · 可重试 · 自动保存
              </span>
            </div>
          </aside>
          <main className="lab-main">
            <div className="lesson-topline">
              <span>
                <span className="tiny-square" />
                {mode === 'library'
                  ? '硬件知识库'
                  : `第 ${String(lesson.id).padStart(2, '0')} 章`}
                <ChevronRight size={13} />
                {mode === 'library' ? '观察 · 理解 · 对照' : lesson.subtitle}
              </span>
              <span className="saved-status">
                {saveError ? (
                  '暂时无法保存，请勿关闭页面'
                ) : (
                  <>
                    <CheckCircle2 size={13} />
                    进度已保存在本机
                  </>
                )}
              </span>
            </div>
            <section className="lesson-hero">
              <div>
                <span className="eyebrow">
                  {mode === 'library'
                    ? 'KNOW YOUR HARDWARE'
                    : 'LEARN BY BUILDING'}
                </span>
                <h2>
                  {mode === 'library' ? '每个部件，都各司其职。' : lesson.name}
                  <span className="lesson-dot">.</span>
                </h2>
                <p>
                  {mode === 'library'
                    ? '点击模型或部件卡，了解用途、组成和连接方式。'
                    : lesson.description}
                </p>
              </div>
              <div className="hero-stamp">
                <CircuitBoard size={32} />
                <span>
                  {mode === 'library'
                    ? '硬件百科'
                    : `CHAPTER ${String(lesson.id).padStart(2, '0')}`}
                </span>
              </div>
            </section>
            <div className="learning-workspace">
              <section className="scene-card" aria-label="交互工作台">
                <div className="scene-toolbar">
                  <div className="machine-caption">
                    <span className="local-dot" />
                    <strong>
                      {machine === 'desktop' ? 'ATX 台式机' : '可升级笔记本'}
                    </strong>
                    <span>3D 交互工作台</span>
                  </div>
                  <div>
                    <select
                      aria-label="画质"
                      value={quality}
                      onChange={(e) => setQuality(e.target.value)}
                    >
                      <option value="standard">标准画质</option>
                      <option value="low">轻量画质</option>
                    </select>
                    <button
                      className={expanded ? 'toggled' : ''}
                      onClick={() => setExpanded((v) => !v)}
                    >
                      <Expand size={14} />
                      {expanded ? '收回观察' : '散开观察'}
                    </button>
                  </div>
                </div>
                {mode === 'library' && (
                  <div className="library-machine">
                    <button
                      className={libraryMachine === 'desktop' ? 'active' : ''}
                      onClick={() => {
                        setLibraryMachine('desktop');
                        setInteraction('inspect');
                        setSelected('board');
                      }}
                    >
                      台式机
                    </button>
                    <button
                      className={libraryMachine === 'laptop' ? 'active' : ''}
                      onClick={() => {
                        setLibraryMachine('laptop');
                        setInteraction('inspect');
                        setSelected('board');
                      }}
                    >
                      笔记本
                    </button>
                  </div>
                )}
                <div className="scene-wrap">
                  <LearningCanvas
                    practice={mode === 'learn' && progress.step === 'practice'}
                    interaction={
                      mode === 'learn' && progress.step === 'practice' && !demo
                        ? interaction
                        : 'inspect'
                    }
                    onInteractionChange={setInteraction}
                    state={canvasState}
                    selected={part.id}
                    expanded={expanded}
                    quality={quality}
                    demo={demo?.id ?? null}
                    onPick={onPick}
                    onAction={perform}
                    onMessage={notify}
                  />
                  <div className="scene-watermark">EXPLORE EVERY COMPONENT</div>
                  <div className="scene-instructions">
                    <MousePointer2 size={13} />
                    {progress.step === 'practice' && mode === 'learn'
                      ? '先选工具 · 拖动空白旋转 · 右侧也可点击操作'
                      : '拖动模型或空白旋转 · 滚轮缩放 · 单击查看'}
                  </div>
                  {demo && (
                    <div className="demo-banner">
                      <Play size={14} />
                      正在示范 · 随后还原，请你再操作一次
                    </div>
                  )}
                </div>
                <div className="tray-heading">
                  <span>
                    <Layers3 size={15} />
                    {progress.step === 'practice' && mode === 'learn'
                      ? '零件托盘'
                      : '认识这些部件'}
                  </span>
                  <span>
                    {mode === 'library'
                      ? '点击查看详细说明'
                      : progress.step === 'practice'
                        ? `${completion(state).done} / ${completion(state).total} 项就绪`
                        : '选择 · 观察 · 理解'}
                  </span>
                </div>
                {mode === 'library' && (
                  <label className="part-search">
                    <Search size={15} />
                    <input
                      aria-label="搜索部件"
                      placeholder="搜索 CPU、内存、供电线…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                )}
                <div className="part-tray" aria-label="部件托盘">
                  {parts
                    .filter(
                      (p) =>
                        mode !== 'library' ||
                        (p.name + ' ' + p.english)
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                    )
                    .map((p) => {
                      const done = partComplete(state, p);
                      return (
                        <button
                          key={p.id}
                          data-part={p.id}
                          className={
                            (part.id === p.id ? 'selected ' : '') +
                            (done ? 'seated' : '')
                          }
                          onClick={() => onPick(p.id)}
                        >
                          <span className="part-mini">
                            {p.kind === 'cable' ? (
                              <Zap size={18} />
                            ) : p.id === 'ram' ? (
                              <MemoryStick size={22} />
                            ) : p.id === 'cpu' ? (
                              <Cpu size={22} />
                            ) : p.id === 'nvme' || p.id === 'sata' ? (
                              <HardDrive size={22} />
                            ) : (
                              <CircuitBoard size={22} />
                            )}
                          </span>
                          <strong>{p.name}</strong>
                          <small>
                            {progress.step === 'practice' && mode === 'learn'
                              ? done
                                ? '已完成'
                                : p.kind === 'cable'
                                  ? state.parts[p.id].connected
                                    ? '待锁定'
                                    : '待连接'
                                  : state.parts[p.id].installed
                                    ? '待固定 / 锁定'
                                    : '待安装'
                              : p.english}
                          </small>
                          {done &&
                            mode === 'learn' &&
                            progress.step === 'practice' && (
                              <CheckCircle2 className="part-check" size={12} />
                            )}
                        </button>
                      );
                    })}
                </div>
                {progress.step === 'practice' && mode === 'learn' && (
                  <div className="practice-controls">
                    <button onClick={undo} disabled={!history.length || !!demo}>
                      <Undo2 size={14} />
                      撤销
                    </button>
                    <button onClick={startPractice}>
                      <RotateCcw size={14} />
                      重置本次练习
                    </button>
                    <span>旋转、观察不会改变通关状态</span>
                  </div>
                )}
              </section>
              <aside className="lesson-panel">
                {mode === 'library' ? (
                  <>
                    <div className="panel-eyebrow">
                      <BookOpen size={15} />
                      部件百科
                    </div>
                    <h3>{part.name}</h3>
                    <span className="english-name">{part.english}</span>
                    <p>{part.description}</p>
                    <h4>组成与连接</h4>
                    <p>
                      {part.kind === 'cable'
                        ? `连接对象：${part.portName}。操作接头本身，不能强拉线体。`
                        : part.id === 'cpu'
                          ? '封装基板、芯片、金属顶盖；核心与缓存通过内部原理视图观察。'
                          : part.id === 'ram'
                            ? 'PCB、DRAM 颗粒、金手指和定位缺口；通过匹配的内存插槽连接主板。'
                            : part.id === 'cooler'
                              ? '底座、导热介质、热管、鳍片与风扇；安装后还要恢复风扇线。'
                              : part.id === 'gpu'
                                ? 'GPU、显存、PCB、供电电路与散热器；通过 PCIe 和必要的辅助供电连接。'
                                : part.id === 'nvme' || part.id === 'sata'
                                  ? '控制器、NAND 闪存与 PCB；接口和固定方式取决于具体外形与协议。'
                                  : part.id === 'board'
                                    ? 'PCB、插槽、焊接芯片、供电电路及接口；焊接元件可以观察，不能直接拔出。'
                                    : '观察该部件的安装位置、固定件与连接对象；进一步细节可进入自由探索。'}
                    </p>
                    <button
                      className="primary"
                      onClick={() => changeMode('explore')}
                    >
                      进入内部结构探索
                      <ArrowRight size={15} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="panel-steps">
                      {Object.entries(stepLabels).map(([id, label], i) => (
                        <span
                          key={id}
                          className={progress.step === id ? 'active' : ''}
                        >
                          <b>{i + 1}</b>
                          {label}
                        </span>
                      ))}
                    </div>
                    {progress.step === 'learn' && (
                      <>
                        <div className="panel-eyebrow">
                          <BookOpen size={15} />
                          先认识，再动手
                        </div>
                        <h3>{lesson.subtitle}</h3>
                        <div className="knowledge-points">
                          {lesson.points.map(([title, text], i) => (
                            <div key={title}>
                              <span>{String(i + 1).padStart(2, '0')}</span>
                              <div>
                                <h4>{title}</h4>
                                <p>{text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="observe-task">
                          <MousePointer2 size={17} />
                          <p>
                            <strong>观察任务</strong>在左侧模型中找到「
                            {partFor(machine, lesson.focus)?.name}
                            」，试着旋转视角观察它的位置。
                          </p>
                        </div>
                        <button
                          className="text-button deep-link"
                          onClick={openDeep}
                        >
                          <Layers3 size={13} />
                          {lesson.machine === 'laptop'
                            ? '对照探索其他笔记本内部结构'
                            : '进入部件内部，查看组成'}
                        </button>
                        <a
                          className="reference-link"
                          href={lesson.reference}
                          target="_blank"
                          rel="noreferrer"
                        >
                          本章知识参考 ↗
                        </a>
                        <button className="primary" onClick={begin}>
                          {isFinal ? '开始整机挑战' : '开始本章小游戏'}
                          <ArrowRight size={16} />
                        </button>
                        <span className="quiet-note">
                          没有倒计时，随时可以回来看讲解。
                        </span>
                      </>
                    )}
                    {progress.step === 'quiz' && question && (
                      <>
                        <div className="panel-eyebrow">
                          <Sparkles size={15} />
                          {
                            {
                              find: '零件侦探',
                              function: '功能配对',
                              composition: '结构探索',
                              connector: '接口挑战',
                            }[question.kind]
                          }
                          <span>
                            {progress.question + 1} / {lesson.questions.length}
                          </span>
                        </div>
                        <h3>{question.prompt}</h3>
                        {question.kind === 'find' && (
                          <p className="quiet-note">
                            可以直接点击 3D 零件，也可以选择下面的名称。
                          </p>
                        )}
                        <div className="answer-options">
                          {question.options.map((option, i) => (
                            <button
                              key={option.id}
                              disabled={answered}
                              className={
                                (choice === option.id
                                  ? answered
                                    ? 'correct'
                                    : 'incorrect'
                                  : '') +
                                (hint >= 2 &&
                                question.kind === 'find' &&
                                option.id === question.answer
                                  ? ' hinted'
                                  : '')
                              }
                              onClick={() => checkAnswer(option.id)}
                            >
                              <span>{String.fromCharCode(65 + i)}</span>
                              {option.label}
                              {answered && option.id === question.answer && (
                                <Check size={16} />
                              )}
                            </button>
                          ))}
                        </div>
                        {answered ? (
                          <>
                            <div className="answer-explanation">
                              <CheckCircle2 size={19} />
                              <p>{question.explanation}</p>
                            </div>
                            <button
                              className="primary"
                              onClick={() => {
                                if (
                                  progress.question + 1 >=
                                  lesson.questions.length
                                )
                                  startPractice();
                                else {
                                  setProgress((p) => ({
                                    ...p,
                                    question: p.question + 1,
                                  }));
                                  setHint(0);
                                  setAnswered(false);
                                  setChoice(null);
                                  setNotice('');
                                }
                              }}
                            >
                              {progress.question + 1 >= lesson.questions.length
                                ? '进入动手练习'
                                : '下一道小游戏'}
                              <ArrowRight size={15} />
                            </button>
                          </>
                        ) : (
                          <button className="hint-button" onClick={showHint}>
                            <Lightbulb size={16} />
                            {hint ? '再给我一点提示' : '需要一点提示'}
                            <span>{hint}/3</span>
                          </button>
                        )}
                      </>
                    )}
                    {progress.step === 'practice' && (
                      <>
                        <div className="panel-eyebrow">
                          <Wrench size={15} />
                          {isFinal
                            ? '整机组装挑战'
                            : removePhase
                              ? '先拆下来'
                              : '再亲手装好'}
                        </div>
                        <h3>{part.name}</h3>
                        <span className="english-name">{part.english}</span>
                        <p className="part-description">{part.description}</p>
                        <div className="assembly-status">
                          <span
                            className={
                              partState.installed || partState.connected
                                ? 'yes'
                                : ''
                            }
                          >
                            <i />
                            {part.kind === 'cable' ? '已连接' : '已就位'}
                          </span>
                          {part.fastener && (
                            <span className={partState.fixed ? 'yes' : ''}>
                              <i />
                              已固定
                            </span>
                          )}
                          {part.latch && (
                            <span className={partState.locked ? 'yes' : ''}>
                              <i />
                              已锁定
                            </span>
                          )}
                        </div>
                        {part.kind === 'cable' && (
                          <label className="connector-select">
                            选择连接接口
                            <select
                              aria-label="连接接口"
                              value={ports[part.id] ?? ''}
                              onChange={(e) =>
                                setPorts((v) => ({
                                  ...v,
                                  [part.id]: e.target.value,
                                }))
                              }
                            >
                              <option value="">请观察接口，再选择…</option>
                              {parts
                                .filter((p) => p.port)
                                .map((p) => (
                                  <option key={p.port} value={p.port}>
                                    {p.portName}
                                  </option>
                                ))}
                              <option value="usb-header">主板 USB 排针</option>
                            </select>
                          </label>
                        )}
                        <div className="operation-grid">
                          {(
                            (part.kind === 'cable'
                              ? [
                                  'connect',
                                  'disconnect',
                                  ...(part.latch ? ['lock', 'unlock'] : []),
                                ]
                              : [
                                  'install',
                                  'remove',
                                  ...(part.fastener
                                    ? ['fasten', 'loosen']
                                    : []),
                                  ...(part.latch ? ['lock', 'unlock'] : []),
                                ]) as Operation[]
                          ).map((op) => (
                            <button
                              key={op}
                              disabled={!!demo}
                              onClick={() =>
                                perform({
                                  type: op,
                                  part: part.id,
                                  port: ports[part.id],
                                  rotation: partState.rotation,
                                })
                              }
                            >
                              {operationNames[op]}
                            </button>
                          ))}
                        </div>
                        {part.kind !== 'cable' && (
                          <button className="rotate-part" onClick={rotate}>
                            <RotateCw size={14} />
                            旋转零件 180°<span>当前 {partState.rotation}°</span>
                          </button>
                        )}
                        <div className="goal-list">
                          <strong>
                            {removePhase ? '拆卸目标' : '本关目标'}
                          </strong>
                          {(isFinal
                            ? parts.map((p) => p.id)
                            : lesson.practice
                          ).map((id) => {
                            const p = partFor(machine, id)!;
                            const done = removePhase
                              ? progress.removed.includes(id)
                              : partComplete(state, p);
                            return (
                              <button
                                key={id}
                                onClick={() => setSelected(id)}
                                className={done ? 'done' : ''}
                              >
                                {done ? (
                                  <CheckCircle2 size={14} />
                                ) : (
                                  <span className="goal-circle" />
                                )}
                                {p.name}
                              </button>
                            );
                          })}
                        </div>
                        <button className="hint-button" onClick={showHint}>
                          <Lightbulb size={16} />
                          {hint >= 2 ? '看看操作示范' : '给我一点提示'}
                          <span>{hint}/3</span>
                        </button>
                        {isFinal ? (
                          <button
                            className="primary"
                            onClick={checkStartup}
                            disabled={boot === 'running'}
                          >
                            <Zap size={16} />
                            检查并模拟开机
                          </button>
                        ) : (
                          <button
                            className="primary"
                            disabled={!goalComplete || !!demo}
                            onClick={summary}
                          >
                            完成动手练习
                            <ArrowRight size={15} />
                          </button>
                        )}
                      </>
                    )}
                    {progress.step === 'summary' && (
                      <div className="chapter-summary">
                        <div className="summary-icon">
                          <Trophy size={40} />
                        </div>
                        <span className="eyebrow">
                          {lesson.id === 10
                            ? 'ALL CHAPTERS COMPLETE'
                            : 'CHAPTER COMPLETE'}
                        </span>
                        <h3>
                          {lesson.id === 10
                            ? '你已经让两台电脑亮起来了。'
                            : '又理解了一块拼图。'}
                        </h3>
                        <p>{lesson.summary}</p>
                        <div className="earned-part">
                          <CheckCircle2 size={18} />
                          {lesson.id === 8
                            ? '台式机组装纪念卡'
                            : lesson.id === 10
                              ? '双机型硬件探索者'
                              : `${lesson.subtitle} · 已掌握`}
                        </div>
                        <button className="primary" onClick={completeLesson}>
                          {lesson.id === 10
                            ? '保存通关纪念'
                            : '完成本章，继续学习'}
                          <ArrowRight size={16} />
                        </button>
                        <button
                          className="text-button"
                          onClick={() => selectLesson(lesson.id)}
                        >
                          再学一遍
                        </button>
                      </div>
                    )}
                  </>
                )}
                <div className="learning-reminder">
                  <CircleHelp size={14} />
                  <span>焊接元件仅供观察；内部图解与真实拆装分别呈现。</span>
                </div>
              </aside>
            </div>
            {notice && (
              <output className="lab-notice">
                <Lightbulb size={17} />
                <span>{notice}</span>
                <button aria-label="关闭提示" onClick={() => setNotice('')}>
                  ×
                </button>
              </output>
            )}
            <footer className="lab-footer">
              <span>
                <Volume2 size={13} />
                边观察，边理解，边动手。
              </span>
              <span>模型基于 PC Anatomy · MIT · 中文教学扩展</span>
            </footer>
          </main>
        </>
      )}
      {boot !== 'off' && (
        <dialog
          open
          className="boot-overlay"
          aria-modal="true"
          aria-label="模拟启动结果"
        >
          <div className="boot-card">
            <Monitor size={40} />
            <span className="eyebrow">教学启动演示</span>
            <h2>
              {boot === 'running'
                ? '正在启动你的电脑…'
                : '组装完成，电脑亮起来了。'}
            </h2>
            <p>
              ✓ 硬件自检通过
              <br />✓ 找到教学启动盘
              <br />
              {boot === 'success'
                ? '✓ 所有部件、固定与连接已检查'
                : '正在加载演示画面…'}
            </p>
            {boot === 'running' ? (
              <div className="boot-progress">
                <i />
              </div>
            ) : (
              <button className="primary" onClick={summary}>
                领取组装纪念卡
                <Trophy size={18} />
              </button>
            )}
            <button
              className="text-button"
              onClick={() => {
                setBoot('off');
                if (bootTimer.current) clearTimeout(bootTimer.current);
              }}
            >
              返回工作台
            </button>
          </div>
        </dialog>
      )}
    </div>
  );
}
