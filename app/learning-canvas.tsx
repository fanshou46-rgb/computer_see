import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Maximize2, RotateCcw } from 'lucide-react';
import type { Action, AssemblyState } from '@/lib/learning-rules';
import type { LearningScene } from '@/lib/learning-scene';
type Props = {
  state: AssemblyState;
  selected: string;
  expanded: boolean;
  quality: string;
  demo: string | null;
  onPick: (id: string) => void;
  onAction: (action: Action) => void;
  onMessage: (message: string) => void;
};
export default function LearningCanvas(props: Props) {
  const host = useRef<HTMLDivElement>(null),
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
      <div className="lab-camera">
        <button
          title="聚焦选中部件"
          aria-label="聚焦选中部件"
          onClick={() => engine.current?.focus(props.selected)}
        >
          <Maximize2 size={16} />
        </button>
        <button
          title="复位视角"
          aria-label="复位视角"
          onClick={() => engine.current?.resetCamera()}
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </>
  );
}
