import {
  makeAssembly,
  partsFor,
  type AssemblyState,
  type Machine,
} from './learning-rules.ts';
export const SAVE_KEY = 'computer-lab-learning-v1';
export type Progress = {
  schema: 1;
  completed: number[];
  lesson: number;
  step: 'learn' | 'quiz' | 'practice' | 'summary';
  question: number;
  assembly: AssemblyState | null;
  removed: string[];
};
export const freshProgress = (): Progress => ({
  schema: 1,
  completed: [],
  lesson: 1,
  step: 'learn',
  question: 0,
  assembly: null,
  removed: [],
});
export function restoreAssembly(value: unknown): AssemblyState | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (
    !['desktop', 'laptop'].includes(String(obj.machine)) ||
    !obj.parts ||
    typeof obj.parts !== 'object'
  )
    return null;
  const machine = obj.machine as Machine,
    target = makeAssembly(machine),
    input = obj.parts as Record<string, unknown>;
  for (const p of partsFor(machine)) {
    const v = input[p.id] as Record<string, unknown> | undefined;
    if (
      !v ||
      !['installed', 'fixed', 'locked', 'connected'].every(
        (k) => typeof v[k] === 'boolean',
      ) ||
      ![0, 180].includes(Number(v.rotation))
    )
      return null;
    if (
      (v.fixed && !v.installed) ||
      (v.locked && !(p.kind === 'cable' ? v.connected : v.installed))
    )
      return null;
    target.parts[p.id] = {
      installed: !!v.installed,
      fixed: !!v.fixed,
      locked: !!v.locked,
      connected: !!v.connected,
      rotation: Number(v.rotation),
    };
  }
  return target;
}
export function restoreProgress(raw: string | null): {
  progress: Progress;
  recovered: boolean;
} {
  if (!raw) return { progress: freshProgress(), recovered: false };
  try {
    const obj = JSON.parse(raw);
    if (!obj || typeof obj !== 'object') throw Error('invalid');
    const completed: number[] = [];
    for (let n = 1; n <= 10; n++) {
      if (Array.isArray(obj.completed) && obj.completed.includes(n))
        completed.push(n);
      else break;
    }
    const unlocked = Math.min(completed.length + 1, 10);
    const lesson =
      Number.isInteger(obj.lesson) && obj.lesson >= 1 && obj.lesson <= unlocked
        ? obj.lesson
        : unlocked;
    const validStep = ['learn', 'quiz', 'practice', 'summary'].includes(
      obj.step,
    );
    const assembly = restoreAssembly(obj.assembly);
    const machine: Machine = lesson >= 9 ? 'laptop' : 'desktop';
    const validAssembly = assembly?.machine === machine ? assembly : null;
    const recovered =
      obj.schema !== 1 ||
      !validStep ||
      (obj.assembly != null && !validAssembly) ||
      (obj.step === 'practice' && !validAssembly);
    return {
      progress: {
        schema: 1,
        completed,
        lesson,
        step: recovered ? 'learn' : obj.step,
        question: Math.max(
          0,
          Number.isInteger(obj.question) ? obj.question : 0,
        ),
        assembly: recovered ? null : validAssembly,
        removed: Array.isArray(obj.removed)
          ? obj.removed.filter(
              (x: unknown) =>
                typeof x === 'string' &&
                partsFor(machine).some((p) => p.id === x),
            )
          : [],
      },
      recovered,
    };
  } catch {
    return { progress: freshProgress(), recovered: true };
  }
}
