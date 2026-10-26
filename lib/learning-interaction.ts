import * as T from 'three';
import type { Machine } from './learning-rules.ts';

export type InteractionMode = 'inspect' | 'manipulate';
export type CameraView = 'default' | 'front' | 'back' | 'top' | 'bottom';
export const GESTURE_SLOP = 6; // CSS 像素，不随设备像素比改变。
export function movedFrom(
  x: number,
  y: number,
  startX: number,
  startY: number,
) {
  return Math.hypot(x - startX, y - startY) > GESTURE_SLOP;
}
export function groundOpacity(cameraY: number, surfaceY: number) {
  const t = T.MathUtils.clamp((cameraY - surfaceY - 0.15) / 1.2, 0, 1);
  return t * t * (3 - 2 * t);
}
/** 以示教模型的世界坐标表示拔出方向，装入走相反方向。 */
export function removalAxis(machine: Machine, id: string) {
  if (machine === 'laptop') {
    if (['ram', 'nvme', 'wifi'].includes(id))
      return new T.Vector3(0, 0.55, 1).normalize();
    if (['keyboard', 'touchpad'].includes(id)) return new T.Vector3(0, -1, 0);
    return new T.Vector3(0, 1, 0);
  }
  if (id === 'psu' || id === 'fan') return new T.Vector3(-1, 0, 0);
  if (id === 'sata') return new T.Vector3(0, 1, 0);
  return new T.Vector3(0, 0, 1);
}
export function viewDirection(view: CameraView, machine: Machine = 'desktop') {
  if (machine === 'desktop' && (view === 'front' || view === 'back'))
    return new T.Vector3(view === 'front' ? 1 : -1, 0.08, 0).normalize();
  return new T.Vector3(
    ...(
      {
        default: [0.7, 0.45, 1],
        front: [0, 0.08, 1],
        back: [0, 0.08, -1],
        top: [0.001, 1, 0.001],
        bottom: [0.001, -1, 0.001],
      } as const
    )[view],
  ).normalize();
}
export type ScreenBox = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
export function inDropZone(x: number, y: number, box: ScreenBox) {
  const cx = (box.left + box.right) / 2,
    cy = (box.top + box.bottom) / 2;
  const rx = Math.max(24, (box.right - box.left) / 2);
  const ry = Math.max(24, (box.bottom - box.top) / 2);
  return Math.abs(x - cx) <= rx && Math.abs(y - cy) <= ry;
}
