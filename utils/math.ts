
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

export const generateTree = (count: number): TreeElement[] => {
  const elements: TreeElement[] = [];
  // Soft pastel festive colors
  const colors = ['#86efac', '#4ade80', '#22c55e', '#fef08a', '#fbbf24', '#d9f99d'];

  // Minimal Trunk
  for (let i = 0; i < 20; i++) {
    elements.push({
      id: generateId(),
      type: ShapeType.LINE,
      position: { x: 0, y: 120 + i * 2, z: 0 },
      scale: 0.4,
      color: '#713f12',
      rotationOffset: 0
    });
  }

  // Tree Body (Bokeh Circles)
  // Adjusted for a "fatter" and "larger" appearance
  for (let i = 0; i < count; i++) {
    // Increased y range for a larger tree
    const y = -180 + Math.random() * 300; 
    // Increased maxRadius multiplier from 85 to 115 for a fatter look
    const maxRadius = ((y + 180) / 300) * 115; 
    const radius = Math.random() * maxRadius;
    const angle = Math.random() * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    elements.push({
      id: generateId(),
      type: ShapeType.BOKEH,
      position: { x, y, z },
      // Reduced dot scale significantly (roughly half of previous)
      scale: 0.3 + Math.random() * 0.8, 
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: 0.2 + Math.random() * 0.5,
      rotationOffset: Math.random() * Math.PI,
      velocity: {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8
      },
      rotationSpeed: (Math.random() - 0.5) * 0.1
    });
  }

  return elements;
};
