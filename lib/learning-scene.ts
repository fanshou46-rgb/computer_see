import * as T from 'three';
import { buildModel, type Piece } from './models.ts';
import { optimizeTeachingPanels } from './learning-panels.ts';
import { disposeModelResources } from './model-stage.ts';
import {
  createStageRuntime,
  createStageLoop,
  fitCameraToBounds,
} from './stage-runtime.ts';
import { scheduleRaycastAcceleration } from './raycast-acceleration.ts';
import {
  movedFrom,
  groundOpacity,
  removalAxis,
  viewDirection,
  inDropZone,
  type InteractionMode,
  type CameraView,
} from './learning-interaction.ts';
import { buildFan, buildScrew } from './parts.ts';
import {
  partsFor,
  partFor,
  probeAction,
  type AssemblyState,
  type Action,
  type Machine,
  type Result,
} from './learning-rules.ts';

type Node = {
  id: string;
  object: T.Object3D;
  base: T.Vector3;
  rotation: T.Quaternion;
  tray: T.Vector3;
};
type Callbacks = {
  pick: (id: string) => void;
  action: (action: Action) => Result;
  message: (text: string) => void;
  ready: () => void;
  error: (text: string) => void;
};
export type LearningScene = ReturnType<typeof createLearningScene>;
export function createLearningScene(
  host: HTMLDivElement,
  machine: Machine,
  callbacks: Callbacks,
) {
  const runtime = createStageRuntime(host, callbacks.error);
  const { scene, renderer, camera, controls, canvas } = runtime;
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMappingExposure = 1.35;
  // 灯光与零件都静止时，转动相机不改变阴影；只在零件姿态变化时重绘。
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  runtime.key.intensity = 2.6;
  scene.background = new T.Color('#edf0eb');
  const root = new T.Group();
  scene.add(root);
  const nodes: Node[] = [];
  const material = (color: string, metalness = 0.3, roughness = 0.45) =>
    new T.MeshStandardMaterial({ color, metalness, roughness });
  const box = (x: number, y: number, z: number, color: string, metal = 0.3) =>
    new T.Mesh(new T.BoxGeometry(x, y, z), material(color, metal));
  const attach = (
    id: string,
    object: T.Object3D,
    position: T.Vector3 | [number, number, number],
  ) => {
    object.position.copy(
      position instanceof T.Vector3 ? position : new T.Vector3(...position),
    );
    object.userData.learningId = id;
    root.add(object);
    nodes.push({
      id,
      object,
      base: object.position.clone(),
      rotation: object.quaternion.clone(),
      tray: new T.Vector3(
        machine === 'desktop' ? 12 : 10,
        machine === 'desktop' ? -2 : 1.5,
        3,
      ),
    });
    return object;
  };
  const anchors: Record<string, T.Vector3> = {};
  const authoredPaths: Record<string, T.Vector3[]> = {};
  if (machine === 'desktop') {
    const model = buildModel('pc', { preserveAssemblies: true });
    host.dataset.panelTrianglesSaved = String(
      optimizeTeachingPanels(model.pieces),
    );
    root.add(model.root);
    for (const [id, path] of Object.entries(
      (model.root.userData.learningPowerPaths as Record<
        string,
        [number, number, number][]
      >) ?? {},
    ))
      authoredPaths[id] = path.map((point) => new T.Vector3(...point));
    root.updateMatrixWorld(true);
    const all = [...model.pieces];
    model.root.traverse((o) => {
      if (o.userData.teachingPieces)
        all.push(...(o.userData.teachingPieces as Piece[]));
    });
    const map: Record<string, string> = {
      motherboard: 'board',
      cpu: 'cpu',
      ram: 'ram',
      nvme: 'nvme',
      m2heatsink: 'm2cover',
      cpucooler: 'cooler',
      graphicscard: 'gpu',
      psu: 'psu',
      ssd: 'sata',
      casefan: 'fan',
      sidepanel: 'panel',
    };
    for (const p of all) {
      if (
        ['atx24', 'eps8', 'mobofanheader', 'sataport'].includes(p.concept) &&
        !anchors[p.concept]
      )
        anchors[p.concept] = p.object.getWorldPosition(new T.Vector3());
    }
    // 先把主板内的可操作部件移到独立根，再移动主板总成，保留世界姿态。
    const sorted = all
      .filter((p) => map[p.concept] && !p.batch)
      .sort(
        (a, b) =>
          Number(a.concept === 'motherboard') -
          Number(b.concept === 'motherboard'),
      );
    for (const p of sorted) {
      root.attach(p.object);
      const pos = p.object.position.clone();
      attach(map[p.concept], p.object, pos);
    }
    for (const p of model.pieces)
      if (['psucable', 'psushroud'].includes(p.concept))
        p.object.visible = false;
    model.root.traverse((o) => {
      if (o.userData.powerFlow || o.userData.airflow || o.userData.contextFrame)
        o.visible = false;
    });
    anchors.atx = anchors.atx24;
    anchors.eps = anchors.eps8;
    anchors.gpuPower = new T.Vector3(2.8, 0, 2.2);
    anchors.fanCable = anchors.mobofanheader ?? new T.Vector3(-0.8, 4, -2.5);
    anchors.caseFanCable = new T.Vector3(3, 3, -2.6);
    anchors.sataData = anchors.sataport ?? new T.Vector3(2, -1, -2.5);
    anchors.sataPower = new T.Vector3(3, -5, -0.3);
    anchors.video = new T.Vector3(-6.8, -0.7, 1);
    for (const [id, path] of Object.entries(authoredPaths))
      anchors[id] = path[path.length - 1].clone();
    const monitor = new T.Group();
    monitor.add(box(4.6, 3, 0.22, '#303e44'));
    const displayFace = box(4.25, 2.6, 0.04, '#526f78');
    displayFace.position.z = 0.14;
    monitor.add(displayFace);
    const stand = box(0.3, 3.8, 0.3, '#77868a', 0.8);
    stand.position.y = -3.2;
    monitor.add(stand);
    const foot = box(2.8, 0.18, 1.7, '#77868a', 0.8);
    foot.position.y = -5.15;
    monitor.add(foot);
    monitor.position.set(-11.2, -1.7, 0);
    root.add(monitor);
    camera.position.set(23, 13, 28);
    controls.target.set(2, 0, 0);
  } else {
    // Latitude 5440 可升级配置的原创教学模型。结构示意，不作为尺寸级维修复刻。
    const shell = box(14.5, 0.32, 9.6, '#59636c', 0.8);
    shell.position.y = -0.1;
    root.add(shell);
    const inner = box(14.1, 0.1, 9.15, '#171e25');
    inner.position.y = 0.1;
    root.add(inner);
    const board = new T.Group();
    const pcb = box(10.3, 0.14, 4.8, '#224f48');
    pcb.position.set(-0.4, 0, 0);
    board.add(pcb);
    const cpu = box(1.6, 0.13, 1.4, '#b2b7b8', 0.8);
    cpu.position.set(1.1, 0.13, -0.4);
    board.add(cpu);
    for (let i = 0; i < 26; i++) {
      const chip = box(0.24, 0.12, 0.38, i % 3 ? '#161c22' : '#a2a7aa');
      chip.position.set(-4.8 + (i % 13) * 0.72, 0.12, i < 13 ? -1.8 : 1.8);
      board.add(chip);
    }
    for (let i = 0; i < 5; i++) {
      const port = box(0.35, 0.48, 0.65, '#a8afb5', 0.85);
      port.position.set(-5.55, 0.05, -1.65 + i * 0.8);
      board.add(port);
    }
    attach('board', board, [0, 0.4, -1.6]);
    const ramModel = buildModel('legionmemory');
    const bounds = new T.Box3().setFromObject(ramModel.root),
      size = bounds.getSize(new T.Vector3());
    const ram = new T.Group();
    ramModel.root.position.sub(bounds.getCenter(new T.Vector3()));
    ramModel.root.scale.setScalar(3.8 / Math.max(size.x, size.z));
    ram.add(ramModel.root);
    attach('ram', ram, [-2.6, 0.8, -1.4]);
    const ssd = new T.Group();
    ssd.add(box(0.95, 0.09, 1.35, '#285d4c'));
    const flash = box(0.72, 0.1, 0.75, '#191d22');
    flash.position.y = 0.11;
    ssd.add(flash);
    attach('nvme', ssd, [-0.2, 0.72, -0.1]);
    const wifi = new T.Group();
    wifi.add(box(0.9, 0.08, 1.15, '#2b6254'));
    const shield = box(0.75, 0.15, 0.6, '#b7bab9', 0.8);
    shield.position.y = 0.11;
    wifi.add(shield);
    attach('wifi', wifi, [4.4, 0.7, -2.5]);
    const cooler = new T.Group();
    const cold = box(1.85, 0.2, 1.55, '#b9854d', 0.85);
    cooler.add(cold);
    for (let n = 0; n < 2; n++) {
      const curve = new T.CatmullRomCurve3([
        new T.Vector3(0, 0.1, n * 0.32),
        new T.Vector3(1.2, 0.1, -0.4 + n * 0.32),
        new T.Vector3(2.8, 0.1, -1.2 + n * 0.32),
      ]);
      cooler.add(
        new T.Mesh(
          new T.TubeGeometry(curve, 18, 0.12, 8, false),
          material('#b97d42', 0.85),
        ),
      );
    }
    for (let n = 0; n < 30; n++) {
      const fin = box(0.045, 0.55, 0.8, '#a4aaad', 0.8);
      fin.position.set(2.25 + n * 0.045, 0.1, -1.05);
      cooler.add(fin);
    }
    attach('cooler', cooler, [1.1, 0.78, -2]);
    const fan = buildFan(material, { size: 2.5 });
    attach('fan', fan, [4, 0.65, -1.2]);
    const battery = new T.Group();
    battery.add(box(10.8, 0.34, 3.15, '#242b32'));
    for (let i = 0; i < 3; i++) {
      const cell = box(3.35, 0.04, 2.9, '#313b45');
      cell.position.set(-3.5 + i * 3.5, 0.19, 0);
      battery.add(cell);
    }
    attach('battery', battery, [0, 0.4, 2.6]);
    const display = new T.Group();
    display.add(box(14.3, 8.3, 0.28, '#68747f', 0.75));
    const screen = box(13.4, 7.4, 0.05, '#172f3d');
    screen.position.z = 0.17;
    display.add(screen);
    for (let n = 0; n < 3; n++) {
      const tile = box(3.1, 1.8, 0.025, ['#789c9b', '#93aaa5', '#c2bea9'][n]);
      tile.position.set(-4 + n * 4, 0, 0.21);
      display.add(tile);
    }
    attach('display', display, [0, 4.1, -4.85]);
    const keyboard = new T.Group();
    keyboard.add(box(11.9, 0.1, 4.1, '#a2acb3', 0.7));
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 13; c++) {
        const key = box(0.69, 0.06, 0.56, '#303944');
        key.position.set(-5.15 + c * 0.85, 0.1, -1.5 + r * 0.72);
        keyboard.add(key);
      }
    attach('keyboard', keyboard, [0, -0.35, -1.5]);
    attach('touchpad', box(4.2, 0.1, 2.2, '#7f8c96', 0.7), [0, -0.35, 2.6]);
    const speakers = new T.Group();
    for (const x of [-6.1, 6.1]) {
      const s = box(0.7, 0.4, 3, '#1b242b');
      s.position.x = x;
      speakers.add(s);
    }
    attach('speaker', speakers, [0, 0.4, 2.35]);
    const panel = box(14.5, 0.14, 9.6, '#a4adb4', 0.8);
    attach('panel', panel, [0, 1.22, 0]);
    anchors.fanCable = new T.Vector3(3.8, 0.7, -0.5);
    anchors.antenna = new T.Vector3(4.4, 0.8, -2.9);
    anchors.displayCable = new T.Vector3(-4, 0.7, -3.7);
    anchors.keyboardCable = new T.Vector3(-1, 0.7, 0.5);
    anchors.touchCable = new T.Vector3(1, 0.7, 0.5);
    anchors.speakerCable = new T.Vector3(-4.7, 0.7, 0);
    anchors.batteryCable = new T.Vector3(0, 0.7, 1.2);
    camera.position.set(18, 18, 24);
    controls.target.set(2, 1, 0);
  }
  // 独立接头与实际线体：未连接时仅显示托盘中的接头；连接后显示整条线路。
  for (const p of partsFor(machine).filter((p) => p.kind === 'cable')) {
    const end = anchors[p.id] ?? new T.Vector3(0, 1, 0),
      g = new T.Group();
    const head = box(p.id === 'atx' ? 0.8 : 0.4, 0.3, 0.32, '#242c35');
    g.add(head);
    const metal = box(0.25, 0.15, 0.04, '#c3ac72', 0.8);
    metal.position.z = 0.17;
    g.add(metal);
    const baseOf = (id: string) =>
      nodes.find((n) => n.id === id)?.base.clone() ?? new T.Vector3();
    const cableSources: Record<string, T.Vector3> =
      machine === 'desktop'
        ? {
            fanCable: baseOf('cooler'),
            caseFanCable: baseOf('fan'),
            sataData: baseOf('sata'),
            video: new T.Vector3(-11.2, -1.7, 0),
          }
        : {
            fanCable: baseOf('fan'),
            antenna: new T.Vector3(-4, 0.8, -4.5),
            displayCable: new T.Vector3(-4, 0.7, -4.6),
            keyboardCable: baseOf('keyboard'),
            touchCable: baseOf('touchpad'),
            speakerCable: new T.Vector3(-6.1, 0.5, 2.35),
            batteryCable: baseOf('battery'),
          };
    const source = cableSources[p.id] ?? baseOf('psu');
    const curve = new T.CatmullRomCurve3(
      authoredPaths[p.id]?.map((point) => point.clone().sub(end)) ?? [
        source.clone().sub(end),
        source
          .clone()
          .lerp(end, 0.55)
          .sub(end)
          .add(new T.Vector3(0, 0.15, 1)),
        new T.Vector3(0, 0, 0),
      ],
    );
    const tube = new T.Mesh(
      new T.TubeGeometry(curve, 22, 0.045, 6, false),
      material(p.id === 'video' ? '#7c9299' : '#35434c'),
    );
    tube.userData.connectedOnly = true;
    g.add(tube);
    attach(p.id, g, end);
  }
  const latches: { id: string; object: T.Group }[] = [];
  for (const p of partsFor(machine).filter((p) => p.latch)) {
    const node = nodes.find((n) => n.id === p.id);
    if (!node) continue;
    const latch = new T.Group(),
      arm = box(0.38, 0.06, 0.08, '#c5b17b', 0.8);
    arm.position.x = 0.17;
    latch.add(arm);
    latch.position.copy(node.base).add(new T.Vector3(0.42, 0.25, 0.1));
    root.add(latch);
    latches.push({ id: p.id, object: latch });
  }
  // 固定件随松紧状态移动；笔记本底盖螺丝为防脱型。
  for (const p of partsFor(machine).filter((p) => p.fastener)) {
    for (const node of nodes.filter((n) => n.id === p.id)) {
      const b = new T.Box3().setFromObject(node.object),
        center = b.getCenter(new T.Vector3());
      const screw = buildScrew(material, 0.13);
      node.object.worldToLocal(center);
      screw.position.copy(center);
      screw.position.y += 0.18;
      screw.userData.learningFastener = true;
      node.object.add(screw);
    }
  }
  // 缓存部件包围盒与状态相关对象，旋转相机时不再反复遍历整棵模型。
  root.updateMatrixWorld(true);
  const structureBounds = new T.Box3();
  root.traverseVisible((o) => {
    if (!(o instanceof T.Mesh)) return;
    if (o instanceof T.InstancedMesh) {
      o.computeBoundingBox();
      if (o.boundingBox)
        structureBounds.union(
          o.boundingBox.clone().applyMatrix4(o.matrixWorld),
        );
    } else {
      o.geometry.computeBoundingBox();
      if (o.geometry.boundingBox)
        structureBounds.union(
          o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld),
        );
    }
  });
  const localBounds = new Map<Node, T.Box3>();
  const connectedObjects: { id: string; object: T.Object3D }[] = [];
  const fasteners: { id: string; object: T.Object3D }[] = [];
  for (const n of nodes) {
    const first = nodes.find((other) => other.id === n.id)!;
    n.tray.add(n.base.clone().sub(first.base));
    localBounds.set(
      n,
      partFor(machine, n.id)?.kind === 'cable'
        ? new T.Box3(
            new T.Vector3(-0.45, -0.2, -0.2),
            new T.Vector3(0.45, 0.2, 0.2),
          )
        : new T.Box3()
            .setFromObject(n.object)
            .applyMatrix4(n.object.matrixWorld.clone().invert()),
    );
    n.object.traverse((o) => {
      if (o.userData.connectedOnly)
        connectedObjects.push({ id: n.id, object: o });
      if (o.userData.learningFastener) fasteners.push({ id: n.id, object: o });
    });
  }
  const cancelAcceleration = scheduleRaycastAcceleration(root);
  const ground = box(60, 0.15, 45, '#e2e8df', 0.05);
  ground.position.y = machine === 'desktop' ? -7.05 : -0.65;
  ground.material.transparent = true;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new T.GridHelper(50, 50, '#bdcbc1', '#d4ddd3');
  grid.position.y = ground.position.y + 0.09;
  grid.material.transparent = true;
  scene.add(grid);
  const outline = new T.Box3Helper(new T.Box3(), 0xce6b43);
  outline.visible = false;
  scene.add(outline);
  const ghost = new T.Box3Helper(new T.Box3(), 0xc76a42);
  const ghostMaterial = ghost.material as T.LineBasicMaterial;
  ghostMaterial.transparent = true;
  ghostMaterial.opacity = 0.85;
  ghostMaterial.depthTest = false;
  ghost.renderOrder = 8;
  ghost.visible = false;
  scene.add(ghost);
  const feedbackElement =
    host.parentElement?.querySelector<HTMLElement>('.lab-drag-feedback');
  function feedback(text: string, tone = 'hint') {
    if (feedbackElement && feedbackElement.textContent !== text)
      feedbackElement.textContent = text;
    if (feedbackElement) feedbackElement.dataset.tone = tone;
  }

  let current: AssemblyState | null = null,
    selected = 'board',
    expanded = false;
  let interaction: InteractionMode = 'inspect',
    demo: string | null = null;
  let disposed = false,
    frameCount = 0,
    focused = false;
  let preview: Pick<Result, 'ok' | 'message'> | null = null;
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2();
  const transform = new T.Matrix4();
  const target = (n: Node) => {
    const v = current?.parts[n.id];
    const seated =
      v &&
      (partFor(machine, n.id)?.kind === 'cable' ? v.connected : v.installed);
    return seated
      ? n.base
          .clone()
          .add(
            expanded
              ? new T.Vector3(0, 0, (nodes.indexOf(n) % 7) * 0.9)
              : new T.Vector3(),
          )
      : n.tray.clone();
  };
  function boundsOf(n: Node, atBase = false) {
    return localBounds
      .get(n)!
      .clone()
      .applyMatrix4(
        transform.compose(
          atBase ? n.base : n.object.position,
          atBase ? n.rotation : n.object.quaternion,
          n.object.scale,
        ),
      );
  }
  function selectedBounds(atBase = false) {
    const b = new T.Box3();
    for (const n of nodes) if (n.id === selected) b.union(boundsOf(n, atBase));
    return b;
  }
  function frameBounds() {
    const b = structureBounds.clone();
    for (const n of nodes)
      if (n.object.visible) {
        b.union(boundsOf(n));
        if (!drag)
          b.union(boundsOf(n).translate(target(n).sub(n.object.position)));
      }
    return b;
  }
  function screen(p: T.Vector3) {
    const b = canvas.getBoundingClientRect(),
      v = p.clone().project(camera);
    return {
      x: b.left + ((v.x + 1) * b.width) / 2,
      y: b.top + ((1 - v.y) * b.height) / 2,
    };
  }
  function screenBox(b: T.Box3) {
    const result = {
      left: Infinity,
      top: Infinity,
      right: -Infinity,
      bottom: -Infinity,
    };
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y])
        for (const z of [b.min.z, b.max.z]) {
          const p = screen(new T.Vector3(x, y, z));
          result.left = Math.min(result.left, p.x);
          result.right = Math.max(result.right, p.x);
          result.top = Math.min(result.top, p.y);
          result.bottom = Math.max(result.bottom, p.y);
        }
    return result;
  }
  type Press = {
    pointerId: number;
    id: string | null;
    x: number;
    y: number;
    moved: boolean;
  };
  type Drag = {
    pointerId: number;
    id: string;
    group: Node[];
    starts: T.Vector3[];
    rotations: T.Quaternion[];
    grab: T.Vector3;
    plane: T.Plane;
    axis: T.Vector3;
    installed: boolean;
    moved: boolean;
    near: boolean;
    distance: number;
    allowed: boolean;
    reason: string;
    axisUsable: boolean;
    startX: number;
    startY: number;
    positions: T.Vector3[];
  };
  let press: Press | null = null,
    drag: Drag | null = null;
  const pointers = new Map<number, { x: number; y: number; type: string }>();
  let forwarding = false;
  function cancel(announce = false, preservePointers = false) {
    const old = drag;
    drag = null;
    press = null;
    controls.enabled = true;
    if (!preservePointers) pointers.clear();
    host.dataset.dragging = 'false';
    if (old) {
      old.group.forEach((n, i) => {
        n.object.position.copy(old.starts[i]);
        n.object.quaternion.copy(old.rotations[i]);
      });
      if (canvas.hasPointerCapture(old.pointerId))
        canvas.releasePointerCapture(old.pointerId);
      if (announce) feedback('已取消拖动，部件恢复原位。');
    }
    if (!disposed) loop.wake();
  }
  function refreshPreview() {
    const v = current?.parts[selected],
      p = partFor(machine, selected);
    preview =
      current && v && p?.kind !== 'cable'
        ? probeAction(current, {
            type: v.installed ? 'remove' : 'install',
            part: selected,
            rotation: v.rotation,
          })
        : null;
  }
  function pose() {
    let unsettled = false;
    for (const latch of latches) {
      latch.object.rotation.z = current?.parts[latch.id]?.locked
        ? 0
        : Math.PI / 2;
      latch.object.visible =
        selected === latch.id || !!current?.parts[latch.id]?.installed;
    }
    for (const n of nodes) {
      const v = current?.parts[n.id];
      if (!v) continue;
      const seated =
        partFor(machine, n.id)?.kind === 'cable' ? v.connected : v.installed;
      n.object.visible = !!seated || selected === n.id || demo === n.id;
      if (drag?.group.includes(n)) {
        const index = drag.group.indexOf(n);
        n.object.position.copy(drag.positions[index]);
        continue;
      }
      const destination = target(n),
        q = n.rotation.clone();
      if (!seated && v.rotation)
        q.multiply(
          new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI),
        );
      n.object.position.lerp(destination, 0.28);
      n.object.quaternion.slerp(q, 0.28);
      if (
        n.object.visible &&
        (n.object.position.distanceToSquared(destination) > 0.0001 ||
          n.object.quaternion.angleTo(q) > 0.001)
      )
        unsettled = true;
    }
    const chosen = nodes.find((n) => n.id === selected && n.object.visible);
    outline.visible = !!chosen;
    if (chosen) outline.box.copy(selectedBounds());
    const v = current?.parts[selected];
    ghost.visible =
      !!chosen &&
      interaction === 'manipulate' &&
      !v?.installed &&
      partFor(machine, selected)?.kind !== 'cable';
    if (ghost.visible) {
      ghost.box.copy(selectedBounds(true));
      ghostMaterial.color.set(
        drag?.near ? (preview?.ok ? '#4c9a62' : '#c25342') : '#c98443',
      );
    }
    if (demo && chosen) {
      chosen.object.position.lerp(chosen.base, 0.09);
      unsettled = true;
    }
    return unsettled;
  }
  const allowedPan = new T.Box3(),
    focusRegion = new T.Box3();
  const loop = createStageLoop(
    controls,
    () => {},
    (_seconds, delta) => {
      if (disposed) return false;
      const unsettled = pose();
      if (unsettled || drag?.moved || demo)
        renderer.shadowMap.needsUpdate = true;
      const moving = controls.update();
      const modelBounds = frameBounds();
      const panRegion = focused ? focusRegion : modelBounds;
      const panCenter = panRegion.getCenter(new T.Vector3()),
        panHalf = panRegion
          .getSize(new T.Vector3())
          .multiplyScalar(0.25)
          .max(new T.Vector3(0.1, 0.1, 0.1));
      allowedPan.set(
        panCenter.clone().sub(panHalf),
        panCenter.clone().add(panHalf),
      );
      const clamped = controls.target
        .clone()
        .clamp(allowedPan.min, allowedPan.max);
      camera.position.add(clamped.clone().sub(controls.target));
      controls.target.copy(clamped);
      const opacity = groundOpacity(
        camera.position.y,
        ground.position.y + 0.075,
      );
      // opacity=0 时也关闭可见性，杜绝透明物体写深度继续挡住模型。
      ground.visible = grid.visible = opacity > 0;
      ground.material.opacity = opacity;
      ground.material.depthWrite = opacity >= 0.99;
      grid.material.opacity = opacity;
      renderer.render(scene, camera);
      host.dataset.renderedMachine = machine;
      host.dataset.frameCount = String(++frameCount);
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.triangles = String(renderer.info.render.triangles);
      host.dataset.geometries = String(renderer.info.memory.geometries);
      host.dataset.textures = String(renderer.info.memory.textures);
      host.dataset.groundVisible = String(ground.visible);
      host.dataset.cameraPosition = JSON.stringify(camera.position.toArray());
      host.dataset.frameDeltaMs = String(Math.round(delta * 10000) / 10);
      const chosen = nodes.find((n) => n.id === selected && n.object.visible);
      if (chosen) {
        host.dataset.selectedPosition = JSON.stringify(
          screen(boundsOf(chosen).getCenter(new T.Vector3())),
        );
        host.dataset.installPosition = JSON.stringify(
          screen(boundsOf(chosen, true).getCenter(new T.Vector3())),
        );
        host.dataset.selectedWorldPositions = JSON.stringify(
          nodes
            .filter((n) => n.id === selected)
            .map((n) => n.object.position.toArray()),
        );
        host.dataset.installZone = JSON.stringify(
          screenBox(selectedBounds(true)),
        );
        const center = boundsOf(chosen).getCenter(new T.Vector3());
        const a = screen(center),
          b = screen(center.clone().add(removalAxis(machine, selected)));
        host.dataset.removalVector = JSON.stringify({
          x: b.x - a.x,
          y: b.y - a.y,
        });
      }
      host.dataset.settled = String(!unsettled);
      host.dataset.dragging = String(!!drag?.moved);
      host.dataset.dropStatus = drag?.near
        ? preview?.ok
          ? 'ready'
          : 'blocked'
        : 'away';
      host.dataset.dragPart = drag?.id ?? '';
      return moving || unsettled || !!drag?.moved || !!demo;
    },
  );

  let lastWidth = 0,
    lastHeight = 0,
    lastRatio = 0,
    quality = 'standard';
  let framingPending = true;
  function placeCamera(view: CameraView = 'default', part = false) {
    if (!current || lastWidth === 0) return;
    cancel();
    pose();
    const bounds = part ? new T.Box3() : frameBounds();
    if (part)
      for (const n of nodes)
        if (n.id === selected)
          bounds.union(boundsOf(n).translate(target(n).sub(n.object.position)));
    if (
      part &&
      interaction === 'manipulate' &&
      !current.parts[selected]?.installed
    )
      bounds.union(selectedBounds(true));
    if (bounds.isEmpty()) return;
    focused = part;
    focusRegion.copy(bounds);
    controls.enableDamping = false;
    controls.update();
    const size = new T.Vector3(),
      look = new T.Vector3(),
      position = new T.Vector3();
    fitCameraToBounds(
      bounds,
      camera,
      position,
      look,
      viewDirection(view, machine),
      size,
      1.08,
      0.7,
    );
    const radius = Math.max(size.length() / 2, 0.15);
    controls.minDistance = Math.max(0.25, radius * 1.05);
    controls.maxDistance = Math.max(
      12,
      frameBounds().getSize(new T.Vector3()).length() * 5,
    );
    camera.position.copy(position);
    controls.target.copy(look);
    controls.update();
    controls.enableDamping = true;
    loop.wake();
  }
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (width < 1 || height < 1) return;
    const w = Math.round(width),
      h = Math.round(height);
    const ratio =
      quality === 'low' ? 0.75 : Math.min(devicePixelRatio, 1.5) * 0.9;
    if (ratio !== lastRatio || w !== lastWidth || h !== lastHeight) {
      if (ratio !== lastRatio) renderer.setPixelRatio(ratio);
      renderer.setSize(w, h, false);
      lastWidth = w;
      lastHeight = h;
      lastRatio = ratio;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      host.dataset.resizeCount = String(
        Number(host.dataset.resizeCount ?? 0) + 1,
      );
      if (framingPending && current) {
        framingPending = false;
        placeCamera();
      }
    }
    loop.wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const visibility = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      resize();
      loop.wake();
    }
  });
  visibility.observe(host);
  const resume = () => {
    if (document.hidden) cancel();
    else {
      resize();
      loop.wake();
    }
  };
  const scroll = () => {
    if (host.getBoundingClientRect().bottom > 0) loop.wake();
  };
  document.addEventListener('visibilitychange', resume);
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', scroll, { passive: true });
  function point(event: { clientX: number; clientY: number }) {
    const b = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - b.left) / b.width) * 2 - 1,
      (-(event.clientY - b.top) / b.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  }
  function pick(event: PointerEvent) {
    point(event);
    root.updateMatrixWorld(true);
    const hits = raycaster.intersectObjects(root.children, true);
    for (const hit of hits) {
      let o: T.Object3D | null = hit.object,
        id: string | null = null,
        visible = true;
      while (o && o !== root) {
        visible &&= o.visible;
        if (o.userData.learningId) id = String(o.userData.learningId);
        o = o.parent;
      }
      if (!visible) continue;
      // 不透过机箱实心表面去选后面的零件。
      return id ? { id, point: hit.point.clone() } : null;
    }
    return null;
  }
  function down(event: PointerEvent) {
    if (forwarding || (event.button !== 0 && event.pointerType !== 'touch'))
      return;
    const first = pointers.entries().next().value;
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      type: event.pointerType,
    });
    if (pointers.size > 1) {
      const wasCaptured = !!drag;
      cancel(false, true);
      if (wasCaptured && first) {
        // 先前的单指由零件工具接管；重新交给 OrbitControls，双指始终缩放/平移。
        forwarding = true;
        canvas.dispatchEvent(
          new PointerEvent('pointerdown', {
            bubbles: true,
            pointerId: first[0],
            pointerType: first[1].type,
            clientX: first[1].x,
            clientY: first[1].y,
            button: 0,
            buttons: 1,
          }),
        );
        forwarding = false;
      }
      return;
    }
    const hit = pick(event);
    press = {
      pointerId: event.pointerId,
      id: hit?.id ?? null,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
    if (interaction !== 'manipulate' || demo || !hit || !current) return;
    const p = partFor(machine, hit.id)!;
    const v = current.parts[hit.id];
    selected = hit.id;
    callbacks.pick(hit.id);
    refreshPreview();
    const group = nodes.filter((n) => n.id === hit.id);
    const action: Action = {
      type: v.installed ? 'remove' : 'install',
      part: hit.id,
      rotation: v.rotation,
    };
    const check =
      p.kind === 'cable'
        ? {
            ok: false,
            message: '线缆请在右侧选择接口并连接，操作接头而不是拉扯线体。',
          }
        : probeAction(current, action);
    const axis = removalAxis(machine, hit.id);
    const a = screen(hit.point),
      b = screen(hit.point.clone().add(axis));
    const axisUsable = !v.installed || Math.hypot(a.x - b.x, a.y - b.y) >= 4;
    drag = {
      pointerId: event.pointerId,
      id: hit.id,
      group,
      starts: group.map((n) => n.object.position.clone()),
      rotations: group.map((n) => n.object.quaternion.clone()),
      positions: group.map((n) => n.object.position.clone()),
      grab: hit.point,
      plane: new T.Plane().setFromNormalAndCoplanarPoint(
        camera.getWorldDirection(new T.Vector3()),
        hit.point,
      ),
      axis,
      installed: v.installed,
      moved: false,
      near: false,
      distance: 0,
      allowed: check.ok && axisUsable,
      reason: axisUsable
        ? check.message
        : '这个视角不便沿插拔方向移动；请切换到侧面，或使用右侧按钮。',
      axisUsable,
      startX: event.clientX,
      startY: event.clientY,
    };
    feedback(
      drag.allowed
        ? v.installed
          ? '沿插拔方向拖出，松手确认；Esc 取消。'
          : '拖向橙色安装轮廓；绿色表示可以就位。'
        : drag.reason,
      drag.allowed ? 'hint' : 'blocked',
    );
    controls.enabled = false;
    event.stopImmediatePropagation();
    canvas.setPointerCapture(event.pointerId);
    loop.wake();
  }
  function move(event: PointerEvent) {
    if (pointers.has(event.pointerId))
      pointers.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
        type: event.pointerType,
      });
    if (press?.pointerId === event.pointerId)
      press.moved ||= movedFrom(event.clientX, event.clientY, press.x, press.y);
    if (!drag || drag.pointerId !== event.pointerId) return;
    drag.moved ||= movedFrom(
      event.clientX,
      event.clientY,
      drag.startX,
      drag.startY,
    );
    if (!drag.moved) return;
    if (!drag.allowed && drag.installed) {
      loop.wake();
      return;
    }
    const bounds = canvas.getBoundingClientRect();
    const x = T.MathUtils.clamp(event.clientX, bounds.left, bounds.right);
    const y = T.MathUtils.clamp(event.clientY, bounds.top, bounds.bottom);
    point({ clientX: x, clientY: y });
    const hit = new T.Vector3();
    if (!raycaster.ray.intersectPlane(drag.plane, hit)) return;
    const offset = hit.sub(drag.grab);
    if (drag.installed) {
      // 将屏幕移动投影到插拔轴，避免任意方向把部件穿过其他结构。
      const a = screen(drag.grab),
        b = screen(drag.grab.clone().add(drag.axis));
      const sx = b.x - a.x,
        sy = b.y - a.y;
      drag.distance = T.MathUtils.clamp(
        ((x - drag.startX) * sx + (y - drag.startY) * sy) / (sx * sx + sy * sy),
        0,
        5,
      );
      offset.copy(drag.axis).multiplyScalar(drag.distance);
    } else {
      // 保留抓取偏移，判定零件中心是否进入目标，而不是强迫鼠标落在中心。
      const desiredCenter = boundsOf(drag.group[0])
        .getCenter(new T.Vector3())
        .sub(drag.group[0].object.position)
        .add(drag.starts[0])
        .add(offset);
      const projected = screen(desiredCenter);
      drag.near = inDropZone(
        projected.x,
        projected.y,
        screenBox(selectedBounds(true)),
      );
      if (drag.near && preview?.ok) {
        const approach = drag.axis.clone().multiplyScalar(0.25);
        offset.copy(drag.group[0].base).sub(drag.starts[0]).add(approach);
      }
      feedback(
        drag.near
          ? preview?.ok
            ? '已对准 · 松手就位，随后仍需固定或锁定。'
            : (preview?.message ?? '暂时不能安装。')
          : '拖向橙色安装轮廓；Esc 取消。',
        drag.near ? (preview?.ok ? 'ready' : 'blocked') : 'hint',
      );
    }
    drag.positions = drag.starts.map((start) => start.clone().add(offset));
    loop.wake();
  }
  function end(event: PointerEvent) {
    pointers.delete(event.pointerId);
    if (drag?.pointerId === event.pointerId) {
      const old = drag;
      drag = null;
      press = null;
      controls.enabled = true;
      host.dataset.dragging = 'false';
      if (canvas.hasPointerCapture(event.pointerId))
        canvas.releasePointerCapture(event.pointerId);
      const inside = (() => {
        const b = canvas.getBoundingClientRect();
        return (
          event.clientX >= b.left &&
          event.clientX <= b.right &&
          event.clientY >= b.top &&
          event.clientY <= b.bottom
        );
      })();
      if (
        old.moved &&
        inside &&
        current &&
        old.allowed &&
        (old.installed ? old.distance >= 0.5 : old.near)
      ) {
        const result = callbacks.action({
          type: old.installed ? 'remove' : 'install',
          part: old.id,
          rotation: current.parts[old.id].rotation,
        });
        if (result.ok) {
          current = result.state;
          // 就位的最后一段沿插拔轴完成，固定/锁扣状态仍由用户操作。
          if (!old.installed)
            old.group.forEach((n) => {
              n.object.position.copy(n.base).addScaledVector(old.axis, 0.25);
            });
          refreshPreview();
          if (focused) placeCamera('default', true);
          feedback(result.message, 'ready');
        } else {
          old.group.forEach((n, i) => n.object.position.copy(old.starts[i]));
          feedback(result.message, 'blocked');
        }
      } else {
        old.group.forEach((n, i) => n.object.position.copy(old.starts[i]));
        if (old.moved)
          feedback(
            !old.allowed
              ? old.reason
              : '未完成投放，已恢复原位；可继续拖动或使用右侧按钮。',
            !old.allowed ? 'blocked' : 'hint',
          );
      }
      loop.wake();
      return;
    }
    if (press?.pointerId === event.pointerId) {
      const old = press;
      press = null;
      if (
        !old.moved &&
        !movedFrom(event.clientX, event.clientY, old.x, old.y) &&
        old.id &&
        pointers.size === 0
      )
        callbacks.pick(old.id);
    }
  }
  const cancelled = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (
      drag?.pointerId === event.pointerId ||
      press?.pointerId === event.pointerId
    )
      cancel(true);
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === 'Escape') cancel(true);
  };
  canvas.addEventListener('pointerdown', down, true);
  canvas.addEventListener('pointermove', move, true);
  canvas.addEventListener('pointerup', end, true);
  canvas.addEventListener('pointercancel', cancelled, true);
  canvas.addEventListener('lostpointercapture', cancelled);
  window.addEventListener('keydown', key);
  resize();
  callbacks.ready();
  return {
    update(
      state: AssemblyState,
      id: string,
      expand: boolean,
      demonstration: string | null = null,
      nextQuality = 'standard',
      mode: InteractionMode = 'inspect',
    ) {
      const stateChanged = current !== state,
        selectionChanged = selected !== id;
      const modeChanged = mode !== interaction;
      if (
        drag &&
        (stateChanged ||
          selectionChanged ||
          mode !== interaction ||
          expand !== expanded ||
          demonstration !== demo)
      )
        cancel();
      current = state;
      selected = id;
      expanded = expand;
      demo = demonstration;
      interaction = mode;
      if (modeChanged || selectionChanged) feedback('');
      host.dataset.interaction = mode;
      quality = nextQuality;
      if (stateChanged) {
        for (const item of connectedObjects)
          item.object.visible = !!state.parts[item.id].connected;
        for (const item of fasteners) {
          item.object.rotation.y = state.parts[item.id].fixed
            ? 0
            : Math.PI * 1.8;
          item.object.scale.y = state.parts[item.id].fixed ? 1 : 1.6;
        }
      }
      renderer.shadowMap.enabled = quality !== 'low';
      if (stateChanged) renderer.shadowMap.needsUpdate = true;
      refreshPreview();
      resize();
      if (framingPending) {
        framingPending = false;
        placeCamera();
      }
      if (selectionChanged && focused) placeCamera();
      else if (modeChanged && focused) placeCamera('default', true);
      loop.wake();
    },
    focus(id: string) {
      selected = id;
      placeCamera('default', true);
    },
    resetCamera() {
      placeCamera();
    },
    setView(view: CameraView) {
      placeCamera(view);
    },
    dispose() {
      cancel();
      disposed = true;
      loop.dispose();
      cancelAcceleration();
      observer.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('keydown', key);
      canvas.removeEventListener('pointerdown', down, true);
      canvas.removeEventListener('pointermove', move, true);
      canvas.removeEventListener('pointerup', end, true);
      canvas.removeEventListener('pointercancel', cancelled, true);
      canvas.removeEventListener('lostpointercapture', cancelled);
      root.add(ground);
      disposeModelResources({ root, pieces: [] });
      outline.geometry.dispose();
      (outline.material as T.LineBasicMaterial).dispose();
      ghost.geometry.dispose();
      ghostMaterial.dispose();
      grid.dispose();
      runtime.dispose();
    },
  };
}
