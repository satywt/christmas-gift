
export enum ShapeType {
  TRIANGLE = 'TRIANGLE',
  CIRCLE = 'CIRCLE',
  LINE = 'LINE',
  STAR = 'STAR',
  GIFT = 'GIFT',
  BOKEH = 'BOKEH',
  TWINKLE = 'TWINKLE' // 外层闪烁小光点
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface TreeElement {
  id: string;
  type: ShapeType;
  position: Point3D;
  scale: number;
  color: string;
  rotationOffset: number;
  char?: string; // Random letter for artistic look
  opacity?: number;
  // Dynamic properties for animation
  velocity?: Point3D; 
  rotationSpeed?: number;
}

export enum GameState {
  WAITING_PERMISSION = 'WAITING_PERMISSION',
  TREE_VIEW = 'TREE_VIEW',
  GIFT_APPEARED = 'GIFT_APPEARED',
  EXPLODED = 'EXPLODED'
}
