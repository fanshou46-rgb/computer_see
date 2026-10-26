'use client';
import {zh} from '@/lib/chinese';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import {
  hasPowerFlow,
  powerPanelState,
  type PowerTarget,
} from '@/lib/power-flow-policy';
import type { ExplorerState } from '@/lib/explorer-state';

const targets: { id: PowerTarget; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cpu', label: 'CPU' },
  { id: 'gpu', label: 'GPU' },
  { id: 'storage', label: "存储" },
];

export default function PowerControls({
  state,
  onToggle,
  onTarget,
  onInspect,
}: {
  state: ExplorerState;
  onToggle: () => void;
  onTarget: (target: PowerTarget) => void;
  onInspect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!hasPowerFlow(state.level)) return null;
  const { routes, visible, explanation, status } = powerPanelState(state);
  return (
    <>
      <button
        className={
          'airflow-toggle power-toggle' + (state.power ? ' active' : '')
        }
        aria-label={state.power ? "隐藏供电" : "显示供电"}
        aria-pressed={state.power}
        aria-controls="power-flow-panel"
        title="追踪从电源到各部件的供电"
        onClick={onToggle}
      >
        <Zap size={15} />
        <span>供电</span>
        <small>{state.power ? 'On' : 'Off'}</small>
      </button>
      {state.power && (
        <section
          className={'power-panel' + (expanded ? ' expanded' : '')}
          id="power-flow-panel"
          aria-label="供电流向"
        >
          <div className="power-heading">
            <strong>追踪供电</strong>
            <span>从电源出发</span>
            <button
              className="power-legend-toggle"
              aria-expanded={expanded}
              aria-controls="power-legend"
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "收起" : "详情"}
            </button>
          </div>
          <fieldset className="power-targets" aria-label="供电对象">
            {targets.map((target) => (
              <button
                key={target.id}
                aria-pressed={state.powerTarget === target.id}
                onClick={() => onTarget(target.id)}
              >
                {zh(target.label)}
              </button>
            ))}
          </fieldset>
          {status && <output className="power-status">{status}</output>}
          <ul className="power-legend" id="power-legend">
            {routes.map((route) => (
              <li
                key={route.id}
                className={!visible.includes(route.id) ? 'power-muted' : ''}
              >
                <i style={{ background: route.color }} aria-hidden="true" />
                <button
                  onClick={() => onInspect(route.inspect)}
                  title={route.description}
                  aria-label={`Inspect ${route.destination}: ${route.label}`}
                >
                  <span>
                    <strong>{zh(route.label)}</strong>
                    <small>{route.voltage}</small>
                  </span>
                  <span className="power-destination">
                    {route.destination} →
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {explanation && <p className="power-explanation">{explanation}</p>}
          <p className="power-note">
            颜色区分线路；箭头表示方向，不表示速度或功率。虚线表示经主板供电。
          </p>
        </section>
      )}
    </>
  );
}
