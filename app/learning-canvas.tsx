import { useEffect, useRef, useState } from 'react';
import {
  LoaderCircle,
  Maximize2,
  RotateCcw,
  Hand,
  MousePointer2,
} from 'lucide-react';
import type { Action, AssemblyState, Result } from '@/lib/learning-rules';
import type { CameraView, InteractionMode } from '@/lib/learning-interaction';
import type { LearningScene } from '@/lib/learning-scene';
type Props = {
  practice: boolean;
  interaction: InteractionMode;
  onInteractionChange: (mode: InteractionMode) => void;
  state: AssemblyState;
  selected: string;
  expanded: boolean;
  quality: string;
  demo: string | null;
  onPick: (id: string) => void;
  onAction: (action: Action) => Result;
  onMessage: (message: string) => void;
};
export default function LearningCanvas(props: Props) {
  const host = useRef<HTMLDivElement>(null),
    viewMenu = useRef<HTMLSelectElement>(null),
    engine = useRef<LearningScene | null>(null),
    current = useRef(props);
  const [readyMachine, setReadyMachine] = useState<string | null>(null),
    [error, setError] = useState('');
  const loading = readyMachine !== props.state.machine;
  useEffect(() => {
    current.current = props;
    engine.current?.update(
      props.state,
      props.selected,
      props.expanded,
      props.demo,
      props.quality,
      props.interaction,
    );
  }, [props]);
  useEffect(() => {
    let cancelled = false;
    import('@/lib/learning-scene')
      .then(({ createLearningScene }) => {
        if (cancelled || !host.current) return;
        setError('');
        engine.current = createLearningScene(
          host.current,
          current.current.state.machine,
          {
            pick: (id) => current.current.onPick(id),
            action: (a) => current.current.onAction(a),
            message: (m) => current.current.onMessage(m),
            ready: () => setReadyMachine(current.current.state.machine),
            error: setError,
          },
        );
        engine.current.update(
          current.current.state,
          current.current.selected,
          current.current.expanded,
          current.current.demo,
          current.current.quality,
          current.current.interaction,
        );
      })
      .catch(() => setError('3D 场景加载失败，请刷新重试。'));
    return () => {
      cancelled = true;
      engine.current?.dispose();
      engine.current = null;
    };
  }, [props.state.machine]);
  return (
    <>
      <div
        ref={host}
        className="lab-canvas"
        aria-label={
          props.state.machine === 'desktop'
            ? '台式机 3D 拆装工作台'
            : '笔记本 3D 拆装工作台'
        }
        data-machine={props.state.machine}
      />
      {loading && (
        <div className="lab-loading">
          <LoaderCircle className="spin" size={25} />
          <span>正在准备你的硬件工作台…</span>
        </div>
      )}
      {error && (
        <div className="lab-loading" role="alert">
          {error}
          <button onClick={() => location.reload()}>重新加载</button>
        </div>
      )}
      <fieldset className="lab-tools" aria-label="工作台工具">
        {props.practice ? (
          <>
            <button
              aria-pressed={props.interaction === 'inspect'}
              onClick={() => props.onInteractionChange('inspect')}
            >
              <MousePointer2 size={13} />
              旋转观察
            </button>
            <button
              aria-pressed={props.interaction === 'manipulate'}
              disabled={!!props.demo}
              onClick={() => props.onInteractionChange('manipulate')}
            >
              <Hand size={13} />
              拖动零件
            </button>
          </>
        ) : (
          <span>观察工具 · 单击选择，拖动旋转</span>
        )}
      </fieldset>
      <output className="lab-drag-feedback" aria-live="polite" />
      <div className="lab-camera">
        <select
          key={props.state.machine}
          ref={viewMenu}
          aria-label="观察视角"
          defaultValue="default"
          onChange={(e) => {
            engine.current?.setView(e.target.value as CameraView);
          }}
        >
          <option value="default">视角 · 默认</option>
          <option value="front">正面</option>
          <option value="back">背面</option>
          <option value="top">顶部</option>
          <option value="bottom">底部</option>
        </select>
        <button
          title="聚焦选中部件"
          aria-label="聚焦选中部件"
          onClick={() => {
            engine.current?.focus(props.selected);
            if (viewMenu.current) viewMenu.current.value = 'default';
          }}
        >
          <Maximize2 size={16} />
        </button>
        <button
          title="恢复全景"
          aria-label="复位视角"
          onClick={() => {
            engine.current?.resetCamera();
            if (viewMenu.current) viewMenu.current.value = 'default';
          }}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </>
  );
}
