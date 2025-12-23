
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState, ShapeType, TreeElement, Point3D } from '../types';
import { generateTree, project } from '../utils/math';

interface ProjectedElement extends TreeElement {
  x: number;
  y: number;
  z: number;
  scale: number;
}

interface SceneProps {
  gameState: GameState;
  rotationY: number;
  onGiftClick: () => void;
}

const Scene: React.FC<SceneProps> = ({ gameState, rotationY, onGiftClick }) => {
  const [elements, setElements] = useState<TreeElement[]>([]);
  const elementsRef = useRef<TreeElement[]>([]);
  const requestRef = useRef<number>(0);
  
  useEffect(() => {
    // 降低总数至 280 以适配手机性能
    const tree = generateTree(280); 
    setElements(tree);
    elementsRef.current = tree;
  }, []);

  const giftPosition = useMemo<Point3D>(() => {
    const y = 30 + Math.random() * 70; 
    const maxRadius = ((y + 180) / 300) * 115;
    const angle = Math.PI / 2 + Math.random() * Math.PI;
    const radius = maxRadius * 0.85; 
    return { x: Math.cos(angle) * radius, y: y, z: Math.sin(angle) * radius };
  }, []);
  
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const animate = () => {
    if (gameState === GameState.EXPLODED) {
      const updated = elementsRef.current.map(el => {
        if (!el.velocity) return el;
        return {
          ...el,
          position: {
            x: el.position.x + el.velocity.x,
            y: el.position.y + el.velocity.y,
            z: el.position.z + el.velocity.z,
          },
          rotationOffset: el.rotationOffset + (el.rotationSpeed || 0.05)
        };
      });
      elementsRef.current = updated;
      setElements(updated);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (gameState === GameState.EXPLODED) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2 - 20; 
  const baseScale = Math.min(dimensions.width, dimensions.height) / 450;

  const renderedElements = useMemo<ProjectedElement[]>(() => {
    // 预分配数组以提高性能
    const projected: ProjectedElement[] = new Array(elements.length + (gameState === GameState.GIFT_APPEARED ? 1 : 0));
    
    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const proj = project(el.position, rotationY, { x: centerX, y: centerY }, baseScale);
      projected[i] = { ...el, ...proj };
    }

    if (gameState === GameState.GIFT_APPEARED) {
      const giftProj = project(giftPosition, rotationY, { x: centerX, y: centerY }, baseScale);
      projected[elements.length] = {
        id: 'THE_GIFT',
        type: ShapeType.GIFT,
        position: giftPosition,
        color: '',
        rotationOffset: 0,
        ...giftProj
      };
    }
    
    // Z-index 排序在手机上必不可少，但数量减少后开销可接受
    return projected.sort((a, b) => a.z - b.z);
  }, [elements, rotationY, centerX, centerY, baseScale, gameState, giftPosition]);

  return (
    <svg 
      width="100%" 
      height="100%" 
      className="absolute top-0 left-0 overflow-visible animate-fade-in"
      style={{ pointerEvents: 'none', willChange: 'transform' }}
      shapeRendering="optimizeSpeed"
    >
      {/* 移除 CSS Filter 提高渲染效率 */}
      {renderedElements.map((el) => {
        if (!el || el.scale < 0 || el.scale > 5) return null;

        const size = 18 * el.scale;

        if (el.type === ShapeType.GIFT) {
          return (
            <g 
              key={el.id} 
              transform={`translate(${el.x}, ${el.y}) scale(${el.scale})`}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={(e) => { e.stopPropagation(); onGiftClick(); }}
            >
              <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="34" className="animate-bounce">🎁</text>
            </g>
          );
        }

        if (el.type === ShapeType.BOKEH) {
          return (
            <circle 
              key={el.id} 
              cx={el.x}
              cy={el.y}
              r={size} 
              fill={el.color} 
              fillOpacity={el.opacity}
            />
          );
        }

        if (el.type === ShapeType.LINE) {
          return (
            <rect 
              key={el.id}
              x={el.x - (size/15)} 
              y={el.y} 
              width={size/8} 
              height={size/2} 
              fill={el.color}
              fillOpacity={0.3}
            />
          );
        }

        return null;
      })}
    </svg>
  );
};

export default Scene;
