
import { Point3D, ShapeType, TreeElement } from '../types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const project = (
  point: Point3D, 
  angleY: number, 
  center: { x: number, y: number }, 
  scale: number
): { x: number, y: number, z: number, scale: number } => {
  const cos = Math.cos(angleY);
  const sin = Math.sin(angleY);
  
  // 简化坐标计算
  const x = point.x * cos - point.z * sin;
  const z = point.x * sin + point.z * cos;
  const y = point.y;

  const fov = 400;
  const perspective = fov / (fov - z);
  
  return {
    x: x * perspective * scale + center.x,
    y: y * perspective * scale + center.y,
    z: z,
    scale: perspective
  };
};

export const generateTree = (count: number = 280): TreeElement[] => {
  const elements: TreeElement[] = [];
  const colors = ['#86efac', '#4ade80', '#22c55e', '#fef08a', '#fbbf24', '#d9f99d'];

  // 简化树干：减少 DOM 节点
  for (let i = 0; i < 8; i++) {
    elements.push({
      id: generateId(),
      type: ShapeType.LINE,
      position: { x: 0, y: 120 + i * 6, z: 0 },
      scale: 0.5,
      color: '#713f12',
      rotationOffset: 0
    });
  }

  // 优化后的树身点位生成
  for (let i = 0; i < count; i++) {
    const y = -180 + Math.random() * 300; 
    const maxRadius = ((y + 180) / 300) * 125; // 稍微调宽一点，让树更丰满
    const radius = Math.random() * maxRadius;
    const angle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    elements.push({
      id: generateId(),
      type: ShapeType.BOKEH,
      position: { x, y, z },
      // 稍微调大点的大小，弥补数量减少后的空隙
      scale: 0.4 + Math.random() * 1.2, 
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.15 + Math.random() * 0.45,
      rotationOffset: Math.random() * Math.PI,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10
      },
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }

  return elements;
};
