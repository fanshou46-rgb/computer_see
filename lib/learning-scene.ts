import * as T from 'three';
import { buildModel, type Piece } from './models.ts';
import { optimizeTeachingPanels } from './learning-panels.ts';
import { disposeModelResources } from './model-stage.ts';
import { createStageRuntime, createStageLoop } from './stage-runtime.ts';
import { buildFan, buildScrew } from './parts.ts';
import {
  partsFor,
  partFor,
  type AssemblyState,
  type Action,
  type Machine,
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
  action: (action: Action) => void;
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
      if (o.userData.powerFlow || o.userData.airflow) o.visible = false;
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
  const ground = box(60, 0.15, 45, '#e2e8df', 0.05);
  ground.position.y = machine === 'desktop' ? -7.05 : -0.65;
  ground.receiveShadow = true;
  scene.add(ground);
  const grid = new T.GridHelper(50, 50, '#bdcbc1', '#d4ddd3');
  grid.position.y = ground.position.y + 0.09;
  scene.add(grid);
  const outline = new T.BoxHelper(root, 0xce6b43);
  outline.visible = false;
  scene.add(outline);
  const ghost = new T.Mesh(
    new T.BoxGeometry(1, 1, 1),
    new T.MeshBasicMaterial({
      color: 0xc76a42,
      wireframe: true,
      transparent: true,
      opacity: 0.65,
      depthTest: false,
    }),
  );
  ghost.renderOrder = 8;
  ghost.visible = false;
  scene.add(ghost);
  let current: AssemblyState | null = null,
    selected = 'board',
    expanded = false,
    demo: string | null = null,
    disposed = false,
    frameCount = 0;
  const raycaster = new T.Raycaster(),
    pointer = new T.Vector2(),
    tmp = new T.Vector3();
  let drag: {
    id: string;
    startX: number;
    startY: number;
    point: T.Vector3;
    plane: T.Plane;
    nodes: Node[];
    moved: boolean;
  } | null = null;
  const target = (node: Node) => {
    const v = current?.parts[node.id];
    const seated =
      v &&
      (partFor(machine, node.id)?.kind === 'cable' ? v.connected : v.installed);
    if (!seated) return node.tray.clone();
    return node.base
      .clone()
      .add(
        expanded
          ? new T.Vector3(0, 0, (nodes.indexOf(node) % 7) * 0.9)
          : new T.Vector3(),
      );
  };
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
      if (!drag?.nodes.includes(n)) n.object.position.lerp(target(n), 0.28);
      const q = n.rotation.clone();
      if (!seated && v.rotation)
        q.multiply(
          new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), Math.PI),
        );
      n.object.quaternion.slerp(q, 0.28);
      if (
        n.object.visible &&
        (n.object.position.distanceToSquared(target(n)) > 0.0001 ||
          n.object.quaternion.angleTo(q) > 0.001)
      )
        unsettled = true;
      n.object.traverse((o) => {
        if (o.userData.connectedOnly) o.visible = v.connected;
        if (o.userData.learningFastener) {
          o.rotation.y = v.fixed ? 0 : Math.PI * 1.8;
          o.scale.y = v.fixed ? 1 : 1.6;
        }
      });
    }
    const chosen = nodes.find((n) => n.id === selected && n.object.visible);
    if (chosen) {
      outline.setFromObject(chosen.object);
      outline.visible = true;
      const v = current?.parts[selected],
        p = partFor(machine, selected);
      ghost.visible = !!v && !(p?.kind === 'cable' ? v.connected : v.installed);
      if (ghost.visible) {
        ghost.position.copy(chosen.base);
        ghost.scale.set(
          p?.kind === 'cable' ? 0.85 : 1.4,
          p?.kind === 'cable' ? 0.55 : 1.4,
          p?.kind === 'cable' ? 0.85 : 1.4,
        );
      }
    } else {
      outline.visible = false;
      ghost.visible = false;
    }
    if (demo && chosen) {
      chosen.object.position.lerp(chosen.base, 0.09);
    }
    return unsettled;
  }
  const loop = createStageLoop(
    controls,
    () => {},
    () => {
      if (disposed) return false;
      const unsettled = pose();
      if (unsettled || drag || demo) renderer.shadowMap.needsUpdate = true;
      const moving = controls.update();
      renderer.render(scene, camera);
      host.dataset.renderedMachine = machine;
      host.dataset.frameCount = String(++frameCount);
      host.dataset.drawCalls = String(renderer.info.render.calls);
      host.dataset.triangles = String(renderer.info.render.triangles);
      host.dataset.geometries = String(renderer.info.memory.geometries);
      host.dataset.textures = String(renderer.info.memory.textures);
      const visibleNode = nodes.find(
        (n) => n.id === selected && n.object.visible,
      );
      if (visibleNode) {
        const bounds = canvas.getBoundingClientRect();
        const screen = (p: T.Vector3) => {
          const v = p.clone().project(camera);
          return {
            x: bounds.left + ((v.x + 1) * bounds.width) / 2,
            y: bounds.top + ((1 - v.y) * bounds.height) / 2,
          };
        };
        host.dataset.selectedPosition = JSON.stringify(
          screen(visibleNode.object.position),
        );
        host.dataset.installPosition = JSON.stringify(screen(visibleNode.base));
      }
      host.dataset.settled = String(!unsettled);
      return moving || unsettled || !!drag || !!demo;
    },
  );
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
    camera.aspect = width / Math.max(height, 1);
    camera.updateProjectionMatrix();
    loop.wake();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  const point = (event: PointerEvent) => {
    const b = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - b.left) / b.width) * 2 - 1,
      (-(event.clientY - b.top) / b.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
  };
  function pick(event: PointerEvent) {
    point(event);
    const hits = raycaster.intersectObjects(root.children, true);
    for (const hit of hits) {
      let o: T.Object3D | null = hit.object;
      while (o) {
        if (o.userData.learningId && o.visible)
          return String(o.userData.learningId);
        o = o.parent;
      }
    }
    return null;
  }
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const id = pick(event);
    if (!id) return;
    callbacks.pick(id);
    selected = id;
    const group = nodes.filter((n) => n.id === id);
    const chosen = group[0];
    if (!chosen) return;
    const normal = camera.getWorldDirection(new T.Vector3());
    drag = {
      id,
      startX: event.clientX,
      startY: event.clientY,
      point: chosen.object.position.clone(),
      plane: new T.Plane().setFromNormalAndCoplanarPoint(
        normal,
        chosen.object.position,
      ),
      nodes: group,
      moved: false,
    };
    controls.enabled = false;
    event.stopImmediatePropagation();
    canvas.setPointerCapture(event.pointerId);
    loop.wake();
  };
  const move = (event: PointerEvent) => {
    if (!drag) return;
    point(event);
    if (!raycaster.ray.intersectPlane(drag.plane, tmp)) return;
    drag.moved =
      Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8;
    if (drag.moved) {
      const offset = tmp.clone().sub(drag.point);
      offset.clampLength(0, 18);
      for (const n of drag.nodes)
        n.object.position.copy(drag.point).add(offset);
    }
    loop.wake();
  };
  const end = (event: PointerEvent) => {
    if (!drag) return;
    const old = drag;
    drag = null;
    controls.enabled = true;
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
    if (old.moved && current) {
      const p = partFor(machine, old.id)!,
        v = current.parts[old.id];
      if (p.kind === 'cable')
        callbacks.message('线缆请在右侧选择对应接口后连接，或使用“断开连接”。');
      else if (v.installed) callbacks.action({ type: 'remove', part: old.id });
      else {
        const screen = old.nodes[0].base.clone().project(camera),
          b = canvas.getBoundingClientRect();
        const distance = Math.hypot(
          event.clientX - (b.left + ((screen.x + 1) * b.width) / 2),
          event.clientY - (b.top + ((1 - screen.y) * b.height) / 2),
        );
        if (distance < 95)
          callbacks.action({
            type: 'install',
            part: old.id,
            rotation: v.rotation,
          });
        else
          callbacks.message('靠近橙色安装框后松开。也可以点击右侧“安装就位”。');
      }
    }
    loop.wake();
  };
  const cancel = () => {
    drag = null;
    controls.enabled = true;
    loop.wake();
  };
  canvas.addEventListener('pointerdown', down, true);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', cancel);
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape') cancel();
  };
  window.addEventListener('keydown', key);
  resize();
  callbacks.ready();
  return {
    update(
      state: AssemblyState,
      id: string,
      expand: boolean,
      demonstration: string | null = null,
      quality = 'standard',
    ) {
      current = state;
      selected = id;
      expanded = expand;
      demo = demonstration;
      renderer.setPixelRatio(
        quality === 'low' ? 0.75 : Math.min(devicePixelRatio, 1.5) * 0.9,
      );
      renderer.shadowMap.enabled = quality !== 'low';
      renderer.shadowMap.needsUpdate = true;
      resize();
      loop.wake();
    },
    focus(id: string) {
      const n = nodes.find((n) => n.id === id);
      if (!n) return;
      const position = target(n);
      controls.target.copy(position);
      camera.position.copy(position).add(new T.Vector3(8, 7, 11));
      loop.wake();
    },
    resetCamera() {
      camera.position.set(
        machine === 'desktop' ? 23 : 18,
        machine === 'desktop' ? 13 : 18,
        machine === 'desktop' ? 28 : 24,
      );
      controls.target.set(2, machine === 'desktop' ? 0 : 1, 0);
      loop.wake();
    },
    dispose() {
      disposed = true;
      loop.dispose();
      observer.disconnect();
      window.removeEventListener('keydown', key);
      canvas.removeEventListener('pointerdown', down, true);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', end);
      canvas.removeEventListener('pointercancel', cancel);
      root.add(ground);
      disposeModelResources({ root, pieces: [] });
      outline.geometry.dispose();
      outline.material.dispose();
      ghost.geometry.dispose();
      ghost.material.dispose();
      grid.dispose();
      runtime.dispose();
    },
  };
}
