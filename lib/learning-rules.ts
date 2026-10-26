/** 教学操作的唯一判定入口。这里不依赖 Three.js，便于独立验证。 */
export type Machine = 'desktop' | 'laptop';
export type Operation =
  | 'install'
  | 'remove'
  | 'fasten'
  | 'loosen'
  | 'lock'
  | 'unlock'
  | 'connect'
  | 'disconnect';
export type Part = {
  id: string;
  name: string;
  english: string;
  description: string;
  kind?: 'cable' | 'cover';
  parent?: string;
  fastener?: boolean;
  latch?: boolean;
  port?: string;
  portName?: string;
  needs?: string[];
  optional?: boolean;
};
const desktop: Part[] = [
  {
    id: 'board',
    name: '主板',
    english: 'Motherboard',
    description: '承载插座、插槽、供电与通信电路，将各部件连接起来。',
    fastener: true,
  },
  {
    id: 'cpu',
    name: '中央处理器',
    english: 'CPU',
    description:
      '执行程序指令。封装内有计算核心、缓存和接口逻辑；金属顶盖帮助传热。',
    parent: 'board',
    latch: true,
  },
  {
    id: 'ram',
    name: '内存套装',
    english: 'DDR5 RAM',
    description:
      '暂存运行中的程序和数据。两条内存分别插在示教主板的 A2、B2 槽，断电后通常不保留数据。',
    parent: 'board',
    latch: true,
  },
  {
    id: 'nvme',
    name: 'M.2 固态硬盘',
    english: 'NVMe SSD',
    description:
      '由控制器、闪存和 PCB 等组成，通过 PCIe 与系统通信，断电仍保留数据。',
    parent: 'board',
    fastener: true,
  },
  {
    id: 'm2cover',
    name: 'SSD 散热片',
    english: 'M.2 heatsink',
    description: '通过导热垫把 SSD 的热量传给金属散热片。',
    parent: 'nvme',
    fastener: true,
    needs: ['nvme:fixed'],
  },
  {
    id: 'cooler',
    name: 'CPU 散热器',
    english: 'CPU cooler',
    description: '底座、热管、鳍片和风扇协作，把 CPU 的热量带到机箱空气中。',
    parent: 'board',
    fastener: true,
    needs: ['cpu:locked'],
  },
  {
    id: 'gpu',
    name: '独立显卡',
    english: 'Graphics card',
    description:
      'GPU 执行图形等并行任务，显存存放相关数据，PCB 和散热组件提供支撑。',
    parent: 'board',
    fastener: true,
    latch: true,
  },
  {
    id: 'psu',
    name: '电源',
    english: 'PSU',
    description:
      '将交流输入转换为电脑使用的直流供电。示教中只操作外部固定和线缆。',
    fastener: true,
  },
  {
    id: 'sata',
    name: 'SATA 固态硬盘',
    english: 'SATA SSD',
    description: '长期保存文件，需要分别连接 SATA 数据线和电源线。',
    fastener: true,
  },
  {
    id: 'fan',
    name: '机箱风扇',
    english: 'Case fans',
    description: '由叶轮、电机、轴承与框架组成，为机箱建立空气流动。',
    fastener: true,
  },
  {
    id: 'atx',
    name: '主板 24-pin 供电线',
    english: 'ATX 24-pin',
    description: '为主板提供主要供电；不能替代 CPU 的 EPS 供电。',
    kind: 'cable',
    port: 'atx24',
    portName: '主板 ATX 24-pin',
    needs: ['board:fixed', 'psu:fixed'],
  },
  {
    id: 'eps',
    name: 'CPU 8-pin 供电线',
    english: 'EPS 8-pin',
    description: '接到主板 CPU 供电插座，再通过稳压电路给 CPU 供电。',
    kind: 'cable',
    port: 'eps8',
    portName: '主板 CPU / EPS 8-pin',
    needs: ['board:fixed', 'psu:fixed'],
  },
  {
    id: 'gpuPower',
    name: '显卡供电线',
    english: '12V-2x6',
    description:
      '为示教显卡提供辅助供电。此显卡采用 12V-2x6，其他型号可能不同。',
    kind: 'cable',
    port: 'gpu12',
    portName: '显卡 12V-2x6',
    needs: ['gpu:fixed', 'gpu:locked', 'psu:fixed'],
  },
  {
    id: 'fanCable',
    name: 'CPU 风扇线',
    english: 'CPU_FAN',
    description: '连接主板 CPU_FAN 接口，为风扇提供供电与控制。',
    kind: 'cable',
    port: 'cpuFan',
    portName: '主板 CPU_FAN',
    needs: ['cooler:fixed', 'board:fixed'],
  },
  {
    id: 'caseFanCable',
    name: '机箱风扇线',
    english: 'SYS_FAN',
    description: '把机箱风扇连接到主板风扇接口。',
    kind: 'cable',
    port: 'sysFan',
    portName: '主板 SYS_FAN',
    needs: ['fan:fixed', 'board:fixed'],
  },
  {
    id: 'sataData',
    name: 'SATA 数据线',
    english: 'SATA data',
    description: '连接 SATA SSD 与主板的数据接口，不能提供硬盘全部电力。',
    kind: 'cable',
    port: 'sataPort',
    portName: '主板 SATA 数据接口',
    needs: ['sata:fixed', 'board:fixed'],
  },
  {
    id: 'sataPower',
    name: 'SATA 电源线',
    english: 'SATA power',
    description: '从电源为 SATA SSD 提供电力，与数据线分开。',
    kind: 'cable',
    port: 'sataPowerPort',
    portName: 'SSD SATA 电源接口',
    needs: ['sata:fixed', 'psu:fixed'],
  },
  {
    id: 'video',
    name: '显示连接线',
    english: 'DisplayPort',
    description: '本示教机将显示器接在独立显卡的输出接口上。',
    kind: 'cable',
    port: 'gpuDP',
    portName: '独立显卡 DisplayPort',
    needs: ['gpu:fixed'],
  },
  {
    id: 'panel',
    name: '机箱侧板',
    english: 'Side panel',
    description: '封闭并保护内部部件。内部拆装前需要先打开。',
    kind: 'cover',
    fastener: true,
  },
];
const laptop: Part[] = [
  {
    id: 'board',
    name: '笔记本主板',
    english: 'System board',
    description:
      '承载焊接 CPU 与集成显卡，以及内存、存储和各类排线接口。CPU 不可像台式机一样直接拔下。',
    fastener: true,
  },
  {
    id: 'ram',
    name: '笔记本内存',
    english: 'DDR4 SO-DIMM',
    description: '短尺寸可插拔内存，斜插入槽后压下，由两侧弹片固定。',
    parent: 'board',
    latch: true,
  },
  {
    id: 'nvme',
    name: 'M.2 2230 SSD',
    english: 'NVMe SSD',
    description: '可更换的短尺寸存储模块；与无线网卡插槽用途不同。',
    parent: 'board',
    fastener: true,
  },
  {
    id: 'wifi',
    name: '无线网卡',
    english: 'WLAN card',
    description: '通过可拆天线接头连接天线，提供无线通信。',
    parent: 'board',
    fastener: true,
  },
  {
    id: 'cooler',
    name: '热管散热组件',
    english: 'Heat sink',
    description:
      '从焊接处理器表面吸热，经热管和鳍片散热，不把处理器当作可插拔模块。',
    parent: 'board',
    fastener: true,
  },
  {
    id: 'fan',
    name: '笔记本风扇',
    english: 'Blower fan',
    description: '离心风扇将空气吹过散热鳍片，热风从机身排出。',
    parent: 'board',
    fastener: true,
  },
  {
    id: 'battery',
    name: '内置电池',
    english: 'Battery pack',
    description: '为电脑提供直流电。先断开连接再进行内部拆装，不拆开电芯。',
    fastener: true,
  },
  {
    id: 'display',
    name: '屏幕总成',
    english: 'Display assembly',
    description: '包括显示面板、外壳、转轴和相关走线；本关按总成操作。',
    fastener: true,
  },
  {
    id: 'keyboard',
    name: '键盘组件',
    english: 'Keyboard',
    description: '将按键动作转为输入信号，借助排线与主板连接。',
    fastener: true,
  },
  {
    id: 'touchpad',
    name: '触摸板',
    english: 'Touchpad',
    description: '检测手指位置与手势，通过排线向系统传递输入。',
    fastener: true,
  },
  {
    id: 'speaker',
    name: '扬声器组件',
    english: 'Speakers',
    description: '把音频电信号转换为声音，通常位于机身两侧。',
    fastener: true,
  },
  {
    id: 'fanCable',
    name: '风扇连接线',
    english: 'Fan cable',
    description: '给风扇供电并传递控制和转速信息。',
    kind: 'cable',
    port: 'cpuFan',
    portName: '主板风扇接口',
    needs: ['fan:fixed', 'board:fixed'],
  },
  {
    id: 'antenna',
    name: '无线网卡天线线',
    english: 'WLAN antennas',
    description: '微型同轴接头对正后连接，拔除时操作接头而非拉扯导线。',
    kind: 'cable',
    port: 'wifiAnt',
    portName: 'WLAN MAIN / AUX',
    needs: ['wifi:fixed'],
  },
  {
    id: 'displayCable',
    name: '屏幕连接线',
    english: 'eDP cable',
    description: '将主板显示信号送到屏幕，需要恢复接口固定件。',
    kind: 'cable',
    port: 'edp',
    portName: '主板 eDP',
    needs: ['board:fixed', 'display:fixed'],
  },
  {
    id: 'keyboardCable',
    name: '键盘排线',
    english: 'Keyboard ribbon',
    description: '先打开锁扣再插入排线，最后合上锁扣。',
    kind: 'cable',
    latch: true,
    port: 'keyboardZif',
    portName: '键盘 ZIF 排线接口',
    needs: ['board:fixed', 'keyboard:fixed'],
  },
  {
    id: 'touchCable',
    name: '触摸板排线',
    english: 'Touchpad ribbon',
    description: '使用带锁扣的扁平排线接口，连接后需要锁定。',
    kind: 'cable',
    latch: true,
    port: 'touchZif',
    portName: '触摸板 ZIF 排线接口',
    needs: ['board:fixed', 'touchpad:fixed'],
  },
  {
    id: 'speakerCable',
    name: '扬声器连接线',
    english: 'Speaker cable',
    description: '将主板音频输出连接到扬声器组件。',
    kind: 'cable',
    port: 'speakerPort',
    portName: '主板扬声器接口',
    needs: ['board:fixed', 'speaker:fixed'],
  },
  {
    id: 'batteryCable',
    name: '电池连接线',
    english: 'Battery cable',
    description: '内部拆装时先断开；装回并检查后再恢复。',
    kind: 'cable',
    port: 'batteryPort',
    portName: '主板电池接口',
    needs: ['battery:fixed', 'board:fixed'],
  },
  {
    id: 'panel',
    name: '底盖',
    english: 'Base cover',
    description: '由防脱螺丝和卡扣固定。松开的防脱螺丝仍留在底盖上。',
    kind: 'cover',
    fastener: true,
  },
];
export const partsFor = (machine: Machine): Part[] =>
  machine === 'desktop' ? desktop : laptop;
export const partFor = (machine: Machine, id: string) =>
  partsFor(machine).find((p) => p.id === id);
export type PartState = {
  installed: boolean;
  fixed: boolean;
  locked: boolean;
  connected: boolean;
  rotation: number;
};
export type AssemblyState = {
  machine: Machine;
  parts: Record<string, PartState>;
};
export type Action = {
  type: Operation;
  part: string;
  port?: string;
  rotation?: number;
};
export type Result = { ok: boolean; state: AssemblyState; message: string };
export function makeAssembly(
  machine: Machine,
  assembled = false,
): AssemblyState {
  return {
    machine,
    parts: Object.fromEntries(
      partsFor(machine).map((p) => [
        p.id,
        {
          installed: assembled && p.kind !== 'cable',
          fixed: assembled && !!p.fastener,
          locked: assembled && !!p.latch,
          connected: assembled && p.kind === 'cable',
          rotation: 0,
        },
      ]),
    ),
  };
}
export function satisfied(state: AssemblyState, requirement: string) {
  const [id, flag = 'installed'] = requirement.split(':');
  return !!state.parts[id]?.[
    flag as 'installed' | 'fixed' | 'locked' | 'connected'
  ];
}
function missing(state: AssemblyState, p: Part) {
  const needs = [
    ...(p.needs ?? []),
    ...(p.parent ? [p.parent + ':fixed'] : []),
  ];
  return needs.find((n) => !satisfied(state, n));
}
export function applyAction(state: AssemblyState, action: Action): Result {
  const p = partFor(state.machine, action.part),
    current = state.parts[action.part];
  const fail = (message: string): Result => ({ ok: false, state, message });
  if (!p || !current) return fail('没有找到这个部件，请重新选择。');
  const internal = p.id !== 'panel' && p.id !== 'batteryCable';
  if (internal && state.parts.panel.installed)
    return fail('先松开外壳固定件并移开侧板或底盖，才能操作内部部件。');
  if (
    state.machine === 'laptop' &&
    internal &&
    state.parts.batteryCable.connected
  )
    return fail('先断开电池连接线，避免带电进行内部拆装。');
  const next = structuredClone(state),
    value = next.parts[p.id];
  const need = missing(state, p);
  if (['install', 'connect'].includes(action.type) && need) {
    const [id, flag] = need.split(':');
    return fail(
      `请先${flag === 'locked' ? '锁定' : flag === 'connected' ? '连接' : '安装并固定'}${partFor(state.machine, id)?.name ?? id}。`,
    );
  }
  if (action.type === 'install') {
    if (p.kind === 'cable') return fail('线缆需要选择正确接口并连接。');
    if (current.installed) return fail('这个部件已经就位。');
    if ((action.rotation ?? current.rotation) % 360 !== 0)
      return fail('方向不对。观察缺口或定位标记，旋转 180° 后再试。');
    if (p.kind === 'cover') {
      const undone = partsFor(state.machine)
        .filter((x) => x.id !== 'panel')
        .find((x) => !partComplete(state, x));
      if (undone)
        return fail(`先完成${undone.name}的安装、固定或连接，再盖上外壳。`);
    }
    value.installed = true;
    value.rotation = 0;
  } else if (action.type === 'remove') {
    if (!current.installed) return fail('部件已经在零件托盘中。');
    if (current.fixed) return fail('固定螺丝还没有松开，请先操作固定件。');
    if (current.locked) return fail('锁扣尚未释放，请先解锁。');
    const dependent = partsFor(state.machine).find(
      (x) =>
        x.id !== p.id &&
        (x.parent === p.id ||
          (x.needs ?? []).some((n) => n.startsWith(p.id + ':'))) &&
        (state.parts[x.id].installed || state.parts[x.id].connected),
    );
    if (dependent)
      return fail(`本练习按逐件拆装进行，请先移开或断开${dependent.name}。`);
    if (p.id === 'cpu' && state.parts.cooler?.installed)
      return fail('请先拆下 CPU 散热器。');
    if (p.id === 'nvme' && state.parts.m2cover?.installed)
      return fail('请先拆下 SSD 散热片。');
    value.installed = false;
  } else if (action.type === 'fasten' || action.type === 'loosen') {
    if (!p.fastener || !current.installed)
      return fail('先把带固定件的部件放到安装位置。');
    if (p.id === 'gpu' && action.type === 'fasten' && !current.locked)
      return fail('先确认显卡插槽卡扣已经锁定，再固定挡板螺丝。');
    value.fixed = action.type === 'fasten';
    if (current.fixed === value.fixed)
      return fail(value.fixed ? '固定件已经锁紧。' : '固定件已经松开。');
  } else if (action.type === 'lock' || action.type === 'unlock') {
    if (!p.latch) return fail('这个部件没有需要操作的锁扣。');
    if (
      action.type === 'lock' &&
      !(p.kind === 'cable' ? current.connected : current.installed)
    )
      return fail('先让部件或排线正确就位，再合上锁扣。');
    if (
      action.type === 'unlock' &&
      p.id === 'cpu' &&
      state.parts.cooler?.installed
    )
      return fail('先移开 CPU 散热器，才能打开插座压框。');
    value.locked = action.type === 'lock';
    if (value.locked === current.locked)
      return fail(value.locked ? '锁扣已经合上。' : '锁扣已经打开。');
  } else if (action.type === 'connect') {
    if (p.kind !== 'cable') return fail('请选择一条线缆。');
    if (current.connected) return fail('这条线已经接好。');
    if (action.port !== p.port)
      return fail(
        `接口不匹配。${p.name}应连接「${p.portName}」，请观察接头形状与标记。`,
      );
    if (current.locked) return fail('先打开排线锁扣。');
    if (p.id === 'batteryCable') {
      const incomplete = partsFor(state.machine)
        .filter((x) => !['panel', 'batteryCable'].includes(x.id))
        .find((x) => !partComplete(state, x));
      if (incomplete) return fail(`先完成${incomplete.name}，最后再接回电池。`);
    }
    value.connected = true;
  } else if (action.type === 'disconnect') {
    if (p.kind !== 'cable' || !current.connected)
      return fail('请选择已经连接的线缆。');
    if (current.locked) return fail('先打开排线接口的锁扣，再拔出排线。');
    value.connected = false;
  } else return fail('无法识别这个操作。');
  return {
    ok: true,
    state: next,
    message: `${p.name}：${{ install: '已正确就位', remove: '已放回托盘', fasten: '固定完成', loosen: '固定件已松开', lock: '锁扣已合上', unlock: '锁扣已打开', connect: '连接正确', disconnect: '已断开连接' }[action.type]}。`,
  };
}
export function partComplete(state: AssemblyState, p: Part) {
  const v = state.parts[p.id];
  return (
    !!v &&
    (p.kind === 'cable' ? v.connected : v.installed) &&
    (!p.fastener || v.fixed) &&
    (!p.latch || v.locked)
  );
}
export function completion(state: AssemblyState) {
  const parts = partsFor(state.machine);
  return {
    done: parts.filter((p) => partComplete(state, p)).length,
    total: parts.length,
  };
}
export function startupCheck(state: AssemblyState): {
  stage: 'post' | 'boot' | 'success';
  issues: string[];
} {
  const required =
    state.machine === 'desktop'
      ? [
          'board',
          'cpu',
          'ram',
          'cooler',
          'gpu',
          'psu',
          'atx',
          'eps',
          'gpuPower',
          'fanCable',
          'video',
        ]
      : [
          'board',
          'ram',
          'cooler',
          'fan',
          'battery',
          'batteryCable',
          'display',
          'displayCable',
          'fanCable',
        ];
  const issues = required
    .filter((id) => !partComplete(state, partFor(state.machine, id)!))
    .map(
      (id) =>
        `${partFor(state.machine, id)!.name}尚未正确安装、固定、锁定或连接`,
    );
  if (issues.length) return { stage: 'post', issues };
  if (!partComplete(state, partFor(state.machine, 'nvme')!))
    return {
      stage: 'boot',
      issues: [
        '硬件自检通过，但未找到启动设备。请安装并固定教学 NVMe 启动盘。',
      ],
    };
  return { stage: 'success', issues: [] };
}
export const operationNames: Record<Operation, string> = {
  install: '安装就位',
  remove: '取下部件',
  fasten: '锁紧固定件',
  loosen: '松开固定件',
  lock: '合上锁扣',
  unlock: '打开锁扣',
  connect: '连接接口',
  disconnect: '断开连接',
};
export function nextAction(state: AssemblyState, id: string): Action | null {
  const p = partFor(state.machine, id),
    v = state.parts[id];
  if (!p || !v || partComplete(state, p)) return null;
  if (p.kind === 'cable')
    return !v.connected
      ? { type: 'connect', part: id, port: p.port }
      : { type: 'lock', part: id };
  if (!v.installed) return { type: 'install', part: id, rotation: 0 };
  if (p.latch && !v.locked) return { type: 'lock', part: id };
  if (p.fastener && !v.fixed) return { type: 'fasten', part: id };
  return null;
}
