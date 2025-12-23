
import { Point3D, ShapeType, TreeElement } from '../types';

export const generateId = (): string => Math.random().toString(36).substr(2, 9);

export const project = (
  point: Point3D, 
  angleY: number, 
  center: { x: number, y: number }, 
  scale: number
): { x: number, y: number, z: number, perspective: number } => {
  const cos = Math.cos(angleY);
  const sin = Math.sin(angleY);
  
  const x = point.x * cos - point.z * sin;
  const z = point.x * sin + point.z * cos;
  const y = point.y;

  const fov = 400;
  const perspective = fov / (fov - z);
  
  return {
    x: x * perspective * scale + center.x,
    y: y * perspective * scale + center.y,
    z: z,
    perspective: perspective
  };
};

export const generateTree = (count: number = 280): TreeElement[] => {
  const elements: TreeElement[] = [];
  const colors = ['#86efac', '#4ade80', '#22c55e', '#fef08a', '#fbbf24', '#d9f99d'];

  // 1. 顶部的星星
  elements.push({
    id: 'TOP_STAR',
    type: ShapeType.STAR,
    position: { x: 0, y: -195, z: 0 },
    scale: 2.5,
    color: '#fde047',
    rotationOffset: 0,
    opacity: 1
  });

  // 2. 树干
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

  // 3. 树身装饰球 (Bokeh)
  for (let i = 0; i < count; i++) {
    const y = -180 + Math.random() * 300; 
    const maxRadius = ((y + 180) / 300) * 125; 
    const radius = Math.random() * maxRadius;
    const angle = Math.random() * Math.PI * 2;

    elements.push({
      id: generateId(),
      type: ShapeType.BOKEH,
      position: {
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius
      },
      scale: 0.5 + Math.random() * 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.2 + Math.random() * 0.5,
      rotationOffset: Math.random() * Math.PI,
      velocity: {
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        z: (Math.random() - 0.5) * 10
      },
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }

  // 4. 外层“星尘”光点 (Twinkle Shell) - 增加到 1200 个粒子
  const twinkleCount = 1200; 
  for (let i = 0; i < twinkleCount; i++) {
    const y = -220 + Math.random() * 380;
    const maxRadius = ((y + 220) / 380) * 180; 
    const radius = maxRadius * (0.6 + Math.random() * 0.6); 
    const angle = Math.random() * Math.PI * 2;

    elements.push({
      id: generateId(),
      type: ShapeType.TWINKLE,
      position: {
        x: Math.cos(angle) * radius,
        y,
        z: Math.sin(angle) * radius
      },
      scale: 0.02 + Math.random() * 0.04, // 极其细小的微尘
      color: '#ffffff', 
      opacity: 0.2 + Math.random() * 0.5,
      // 这里的 rotationOffset 用作该粒子对 Tilt 的“跟随系数”
      rotationOffset: 0.05 + Math.random() * 0.15, 
      // 这里的 rotationSpeed 用作粒子自身的“空气漂流速度”
      rotationSpeed: 0.5 + Math.random() * 1.5, 
      velocity: {
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 12,
        z: (Math.random() - 0.5) * 12
      }
    });
  }

  return elements;
};
