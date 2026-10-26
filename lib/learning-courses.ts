import {
  makeAssembly,
  type Action,
  type AssemblyState,
  type Machine,
} from './learning-rules.ts';
export type GameKind =
  | 'find'
  | 'function'
  | 'composition'
  | 'connector'
  | 'local'
  | 'build';
export type Question = {
  kind: 'find' | 'function' | 'composition' | 'connector';
  prompt: string;
  options: { id: string; label: string }[];
  answer: string;
  explanation: string;
  target?: string;
};
export type Lesson = {
  id: number;
  name: string;
  subtitle: string;
  machine: Machine;
  focus: string;
  color: string;
  description: string;
  points: [string, string][];
  questions: Question[];
  practice: string[];
  summary: string;
  reference: string;
};
const q = (
  kind: Question['kind'],
  prompt: string,
  options: string[],
  answer: number,
  explanation: string,
  target?: string,
): Question => ({
  kind,
  prompt,
  options: options.map((label, i) => ({ id: String(i), label })),
  answer: String(answer),
  explanation,
  target,
});
export const lessons: Lesson[] = [
  {
    id: 1,
    name: '电脑的骨架',
    subtitle: '机箱与主板',
    machine: 'desktop',
    focus: 'board',
    color: '#80bda9',
    description:
      '先从整体认识电脑。机箱提供支撑和保护，主板将计算、存储、供电和外部接口连接起来。',
    points: [
      ['机箱', '框架、面板、主板托盘、风扇安装位和走线空间。'],
      ['主板', 'PCB、CPU 插座、内存与扩展插槽、供电电路和接口。'],
      ['铜柱', '把主板背面与金属托盘隔开，固定点必须与主板安装孔对应。'],
    ],
    questions: [
      q(
        'find',
        '请在 3D 场景中找到主板。',
        ['主板', '电源', '独立显卡'],
        0,
        '主板是承载插座、插槽和控制电路的主要电路板。',
        'board',
      ),
      q(
        'connector',
        '哪组连接关系是正确的？',
        ['CPU → CPU 插座', '内存 → SATA 接口', '显卡 → 风扇接口'],
        0,
        '接口的机械形状与电气用途都必须匹配。',
      ),
    ],
    practice: ['board'],
    summary: '你已经认识机箱、主板和固定方式，知道接口不能随意互换。',
    reference:
      'https://www.intel.com/content/www/us/en/gaming/resources/how-to-build-a-gaming-pc.html',
  },
  {
    id: 2,
    name: '指令的执行者',
    subtitle: 'CPU 与插座',
    machine: 'desktop',
    focus: 'cpu',
    color: '#8eacdd',
    description:
      'CPU 读取并执行程序指令，完成运算和控制。它与内存、存储及其他设备协作，不能独自完成所有工作。',
    points: [
      ['组成', '基板、芯片与金属顶盖；芯片内的核心、缓存等属于微观结构。'],
      ['安装', '本示教机使用 AM5 插座，按定位标记放置 CPU，再锁好压框。'],
      ['边界', 'CPU 内部视图是原理示意；芯片不能当作普通插接件拔出。'],
    ],
    questions: [
      q(
        'find',
        '在场景中找到 CPU。',
        ['内存', '中央处理器', '显卡'],
        1,
        'CPU 安装在主板专用插座内，散热器会覆盖其上方。',
        'cpu',
      ),
      q(
        'composition',
        '哪项属于芯片内部的逻辑组成？',
        ['机箱侧板', '计算核心与缓存', 'SATA 数据线'],
        1,
        '核心与缓存是芯片内部的结构，不是装机时需要插接的独立零件。',
      ),
    ],
    practice: ['cpu'],
    summary: 'CPU 的方向、插座与锁扣都正确，才算完成安装。',
    reference:
      'https://download-2.msi.com/archive/mnu_exe/mb/PROB650-PWIFI.pdf',
  },
  {
    id: 3,
    name: '运行中的工作台',
    subtitle: '内存 RAM',
    machine: 'desktop',
    focus: 'ram',
    color: '#8fc9df',
    description:
      '内存保存 CPU 当前需要处理的程序和数据。它像临时工作台，容量影响能同时容纳多少工作内容。',
    points: [
      [
        '组成',
        'PCB、DRAM 颗粒、金手指与定位缺口；DDR5 模组还包含电源管理等电路。',
      ],
      ['作用', '运行时临时存取；普通 DRAM 断电后数据会丢失。'],
      ['安装', '对准缺口，均匀压入指定插槽，再确认两侧固定机构到位。'],
    ],
    questions: [
      q(
        'find',
        '找到安装在主板上的内存套装。',
        ['内存套装', 'SATA 固态硬盘', 'CPU 散热器'],
        0,
        '本示教机的两条 DDR5 内存安装在 A2、B2 槽。',
        'ram',
      ),
      q(
        'function',
        '电脑断电后，照片主要保存在哪里？',
        ['普通内存 RAM', 'SSD 等持久存储设备', 'CPU 缓存'],
        1,
        '照片文件长期保存在 SSD；打开时数据会被读入内存供程序处理。',
      ),
      q(
        'composition',
        '内存上的金手指有什么作用？',
        ['与插槽建立电气连接', '让风扇转动', '长期保存文件'],
        0,
        '金手指是模组与主板之间的电气连接触点。',
      ),
    ],
    practice: ['ram'],
    summary: '你能区分内存与存储，并通过方向和锁扣判断内存是否装好。',
    reference:
      'https://www.intel.com/content/www/us/en/gaming/resources/how-much-ram-gaming.html',
  },
  {
    id: 4,
    name: '文件的长期住所',
    subtitle: 'SSD 与接口',
    machine: 'desktop',
    focus: 'nvme',
    color: '#a6cfad',
    description:
      'SSD 在断电后仍能保存系统、程序和文件。M.2 是外形与连接形式，NVMe 是存储通信协议，二者不是同一个概念。',
    points: [
      ['组成', '控制器负责管理数据，NAND 闪存保存数据，PCB 连接各电路。'],
      [
        'M.2 NVMe',
        '沿正确角度插入匹配插槽，压下后用固定件锁定，再安装散热片。',
      ],
      ['SATA SSD', '数据线接主板，电源线接电源；两条线承担不同职责。'],
    ],
    questions: [
      q(
        'composition',
        'SSD 中长期保存数据的主要器件是什么？',
        ['NAND 闪存', '散热鳍片', '风扇叶片'],
        0,
        'NAND 闪存是非易失性存储介质；控制器负责调度和管理。',
      ),
      q(
        'connector',
        'SATA SSD 通常需要哪两种连接？',
        ['SATA 数据线 + SATA 电源线', 'CPU 风扇线 + 显示线', '两条内存插槽'],
        0,
        'SATA 数据与供电分开；M.2 NVMe 的连接方式不同。',
      ),
    ],
    practice: ['nvme', 'm2cover', 'sata', 'sataData', 'sataPower'],
    summary: '你能识别两类 SSD，并分别完成插槽固定或数据、供电连接。',
    reference:
      'https://www.intel.com/content/www/us/en/gaming/resources/what-is-an-ssd.html',
  },
  {
    id: 5,
    name: '让画面出现',
    subtitle: '显卡与显示',
    machine: 'desktop',
    focus: 'gpu',
    color: '#bca7df',
    description:
      'GPU 擅长大量并行计算，常用于图形处理。独立显卡包含自己的 PCB、显存和散热组件；集成显卡不一定是独立可拔出的卡。',
    points: [
      ['组成', 'GPU、显存、供电电路、PCB、散热组件、PCIe 连接触点与显示接口。'],
      ['安装', '插入 PCIe x16 槽，确认卡扣，再固定机箱挡板。'],
      ['连接', '本示教显卡还需要辅助供电，显示器接在它的 DisplayPort 输出端。'],
    ],
    questions: [
      q(
        'find',
        '找到独立显卡。',
        ['CPU', '独立显卡', '电源'],
        1,
        '显卡是插在主板扩展槽中的独立总成，GPU 是其核心芯片。',
        'gpu',
      ),
      q(
        'composition',
        '显卡和 GPU 的关系是？',
        [
          '两者在所有情况下完全相同',
          'GPU 是显卡中的核心芯片',
          'GPU 是机箱风扇',
        ],
        1,
        '显卡还包括显存、供电和散热等部分。',
      ),
    ],
    practice: ['gpu', 'gpuPower', 'video'],
    summary: '显卡插槽、卡扣、挡板固定、辅助供电和显示输出各有作用。',
    reference:
      'https://www.nvidia.com/en-us/geforce/graphics-cards/50-series/rtx-5090/',
  },
  {
    id: 6,
    name: '把热量带走',
    subtitle: '散热与气流',
    machine: 'desktop',
    focus: 'cooler',
    color: '#dfb18b',
    description:
      '散热不是制造冷气，而是把热量从芯片移到更大的表面，再让空气带走。导热和空气流动需要一起工作。',
    points: [
      ['传热', '芯片 → 导热界面 → 散热底座与热管 → 鳍片 → 空气。'],
      ['风扇', '框架、电机、轴承和叶轮；风扇线提供供电与控制。'],
      [
        '安装',
        '散热器按正确方式固定，CPU 风扇连接 CPU_FAN，机箱风扇连接 SYS_FAN。',
      ],
    ],
    questions: [
      q(
        'composition',
        '哪条传热路径更合理？',
        [
          '芯片 → 导热界面 → 散热器 → 空气',
          '空气 → SSD → 电源 → CPU',
          '风扇线 → 内存 → 屏幕',
        ],
        0,
        '导热界面减少接触热阻，鳍片增加与空气接触的面积。',
      ),
      q(
        'connector',
        'CPU 风扇线应接在哪里？',
        ['主板 CPU_FAN', 'SATA 数据接口', '显示器接口'],
        0,
        'CPU_FAN 能提供风扇供电和控制，并帮助主板监测转速。',
      ),
    ],
    practice: ['cooler', 'fan', 'fanCable', 'caseFanCable'],
    summary: '你能解释散热组件的分工，并安装、固定及连接风扇。',
    reference:
      'https://www.intel.com/content/www/us/en/gaming/resources/cpu-cooler-liquid-cooling-vs-air-cooling.html',
  },
  {
    id: 7,
    name: '接通整台电脑',
    subtitle: '电源与线缆',
    machine: 'desktop',
    focus: 'psu',
    color: '#ddc17e',
    description:
      '电源把交流输入转换为电脑需要的直流供电。主板、CPU、显卡和存储使用不同的接头，不能只凭“看起来插得进去”判断。',
    points: [
      ['供电', 'ATX 24-pin、CPU EPS 和显卡辅助供电是不同连接。'],
      ['数据', 'SATA 数据线、显示线传输信号，不能替代相应电源线。'],
      [
        '协作',
        '打开照片：存储读取文件，内存暂存，CPU 执行程序，显示相关部件生成并输出画面。',
      ],
    ],
    questions: [
      q(
        'function',
        '打开一张保存在 SSD 的照片，哪些部件会参与？',
        ['只有 SSD', '存储、内存、CPU 与显示相关部件协作', '只有电源'],
        1,
        '任务由多个部件协作，不能把“打开照片”只归属于一个硬件。',
      ),
      q(
        'connector',
        'CPU 的 EPS 供电线应连接到？',
        ['主板 CPU / EPS 插座', '显卡的视频输出端', 'SATA 数据接口'],
        0,
        'CPU 供电与主板 24-pin 都需要连接，接头用途不能互换。',
      ),
    ],
    practice: ['psu', 'atx', 'eps'],
    summary: '你能分别识别供电线和数据线，并检查容易遗漏的 CPU 供电。',
    reference:
      'https://www.intel.com/content/www/us/en/gaming/resources/power-supply.html',
  },
  {
    id: 8,
    name: '我的第一台电脑',
    subtitle: '台式机总挑战',
    machine: 'desktop',
    focus: 'board',
    color: '#b2c493',
    description:
      '现在从零件托盘开始，把学到的知识连起来。你可以自己选择顺序，系统只在依赖不满足时解释原因。',
    points: [
      ['就位', '先正确安装，再完成螺丝、卡扣与接线。'],
      ['检查', '分别检查硬件自检条件和启动存储，避免把两类问题混淆。'],
      ['完成', '通过整机检查并播放教学启动画面，获得台式机组装纪念卡。'],
    ],
    questions: [],
    practice: [],
    summary: '台式机组装完成！你已经把零件、连接和工作原理串联起来。',
    reference:
      'https://www.intel.com/content/www/us/en/gaming/resources/how-to-build-a-gaming-pc.html',
  },
  {
    id: 9,
    name: '缩小到一本书里',
    subtitle: '笔记本结构',
    machine: 'laptop',
    focus: 'ram',
    color: '#a9bfe0',
    description:
      '这是一台参考 Latitude 5440 可升级配置制作的教学笔记本。CPU 和集显焊接在主板上，内存与 SSD 可以按正确步骤更换。',
    points: [
      [
        '内部布局',
        '底盖、电池、主板、SO-DIMM、SSD、无线网卡、热管风扇、屏幕和输入组件。',
      ],
      ['操作顺序', '关机断开外部电源，打开底盖后先断开电池，再进行内部更换。'],
      [
        '排线与焊接',
        '排线先开锁扣再插拔；CPU 与其他焊接芯片仅供观察，不能直接拔下。',
      ],
    ],
    questions: [
      q(
        'find',
        '找到笔记本的可升级内存。',
        ['内置电池', 'SO-DIMM 内存', '风扇'],
        1,
        'SO-DIMM 比台式机 DIMM 短，通过两侧弹片固定。',
        'ram',
      ),
      q(
        'composition',
        '这台教学笔记本上，哪项不能像内存一样拔下？',
        ['焊接 CPU', 'SO-DIMM', '可更换 SSD'],
        0,
        'CPU 焊接在主板上。不同笔记本的可升级范围必须按具体型号确认。',
      ),
      q(
        'connector',
        '内部拆装前应该先做什么？',
        ['断开电池连接', '把电池接回再拆', '拉扯屏幕排线'],
        0,
        '在示教流程中，先断开电池，再操作内部部件。',
      ),
    ],
    practice: ['batteryCable', 'ram', 'nvme', 'keyboardCable'],
    summary: '你掌握了笔记本电池隔离、内存更换和排线锁扣的基本操作。',
    reference:
      'https://www.dell.com/support/manuals/en-us/latitude-14-5440-laptop/latitude-5440-owners-manual/major-components-of-latitude-5440?guid=guid-d8923b1b-17a3-4f3c-afa1-8bb58d464e96&lang=en-us',
  },
  {
    id: 10,
    name: '让笔记本重新亮起',
    subtitle: '笔记本总挑战',
    machine: 'laptop',
    focus: 'board',
    color: '#a8cbb9',
    description:
      '完成这台教学笔记本的组装与连接。电池最后接回，底盖最后安装，所有排线锁扣都要恢复。',
    points: [
      ['紧凑布局', '先完成主板和内部组件的安装、固定。'],
      ['连接恢复', '风扇、天线、屏幕、键盘、触摸板与扬声器分别接入对应接口。'],
      ['最后检查', '内部工作完成后再连接电池，安装底盖，检查并启动。'],
    ],
    questions: [],
    practice: [],
    summary: '两种机型全部通关！你能区分台式机与笔记本的布局和拆装方式。',
    reference:
      'https://www.dell.com/support/manuals/en-us/latitude-14-5440-laptop/latitude-5440-owners-manual/major-components-of-latitude-5440?guid=guid-d8923b1b-17a3-4f3c-afa1-8bb58d464e96&lang=en-us',
  },
];
export function practiceAssembly(lesson: Lesson): AssemblyState {
  if (lesson.id === 8 || lesson.id === 10) return makeAssembly(lesson.machine);
  const state = makeAssembly(lesson.machine, true);
  state.parts.panel.installed = false;
  state.parts.panel.fixed = false;
  if (lesson.machine === 'laptop' && lesson.id !== 9)
    state.parts.batteryCable.connected = false;
  if (![3, 9].includes(lesson.id))
    for (const id of lesson.practice)
      state.parts[id] = {
        installed: false,
        fixed: false,
        locked: false,
        connected: false,
        rotation: 0,
      };
  if (lesson.id === 2) {
    state.parts.cooler.installed = false;
    state.parts.cooler.fixed = false;
    state.parts.fanCable.connected = false;
  }
  return state;
}
export function observationAssembly(lesson: Lesson) {
  const state = makeAssembly(lesson.machine, true);
  state.parts.panel.installed = false;
  state.parts.panel.fixed = false;
  if (lesson.machine === 'laptop') state.parts.batteryCable.connected = false;
  // 打开散热器观察 CPU；仅为观察初始姿态，不计入组装通关。
  if (lesson.focus === 'cpu') {
    state.parts.cooler.installed = false;
    state.parts.cooler.fixed = false;
    state.parts.fanCable.connected = false;
  }
  return state;
}
export function solution(state: AssemblyState, targets?: string[]): Action[] {
  // 演示与自动验收仍调用 applyAction，不能跳过依赖直接改状态。
  const ids = targets ?? Object.keys(state.parts);
  return ids.flatMap(
    (part) =>
      [
        { type: 'install', part },
        { type: 'lock', part },
        { type: 'fasten', part },
        { type: 'connect', part },
      ] as Action[],
  );
}
