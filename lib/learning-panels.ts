import * as T from 'three';
import type { Piece } from './models.ts';

/** 网孔的视觉密度保留，课程工作台不必为每个孔绘制背面与侧壁。 */
export function optimizeTeachingPanels(pieces: Piece[]): number {
  let saved = 0;
  for (const piece of pieces.filter((p) =>
    ['frontpanel', 'toppanel'].includes(p.concept),
  )) {
    piece.object.traverse((object) => {
      if (
        !(object instanceof T.Mesh) ||
        object instanceof T.InstancedMesh ||
        !(object.material instanceof T.MeshStandardMaterial)
      )
        return;
      const geometry = object.geometry;
      const triangles =
        (geometry.index?.count ?? geometry.attributes.position.count) / 3;
      if (triangles < 10000) return;
      geometry.computeBoundingBox();
      const bounds = geometry.boundingBox!,
        size = bounds.getSize(new T.Vector3()),
        dimensions = [size.x, size.y, size.z].sort((a, b) => a - b);
      if (dimensions[0] / dimensions[2] > 0.06) return;
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const context = canvas.getContext('2d')!;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, 64, 64);
      context.fillStyle = '#000000';
      context.beginPath();
      context.arc(32, 32, 22, 0, Math.PI * 2);
      context.fill();
      const texture = new T.CanvasTexture(canvas);
      texture.wrapS = T.RepeatWrapping;
      texture.wrapT = T.RepeatWrapping;
      texture.repeat.set(
        Math.max(1, Math.round(dimensions[2] * 5)),
        Math.max(1, Math.round(dimensions[1] * 5)),
      );
      const material = object.material.clone();
      material.alphaMap = texture;
      material.alphaTest = 0.45;
      material.transparent = false;
      material.side = T.DoubleSide;
      object.material = material;
      const replacement = new T.BoxGeometry(size.x, size.y, size.z);
      const center = bounds.getCenter(new T.Vector3());
      replacement.translate(center.x, center.y, center.z);
      replacement.computeBoundingBox();
      object.geometry = replacement;
      geometry.dispose();
      saved += triangles - 12;
    });
  }
  return saved;
}
