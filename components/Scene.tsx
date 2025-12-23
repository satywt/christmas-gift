
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameState, ShapeType, TreeElement, Point3D } from '../types';
import { generateTree, project } from '../utils/math';

interface ProjectedElement extends TreeElement {
  x: number;
  y: number;
  z: number;
  perspective: number;
  currentOpacity?: number; 
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
  const [autoDrift, setAutoDrift] = useState(0);
  
  useEffect(() => {
    const tree = generateTree(280); 
    setElements(tree);
    elementsRef.current = tree;
  }, []);

  const giftPosition = useMemo<Point3D>(() => {
    // 允许礼物出现在树的任意角度（0到2π）
    const y = 20 + Math.random() * 80; 
    const maxRadius = ((y + 180) / 300) * 125;
    const angle = Math.random() * Math.PI * 2; 
    const radius = maxRadius * 0.95; 
    return { x: Math.cos(angle) * radius, y: y, z: Math.sin(angle) * radius };
  }, []);
  
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const animate = () => {
    setAutoDrift(prev => prev + 0.0015);

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
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [gameState]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2 - 20; 
  const baseScale = Math.min(dimensions.width, dimensions.height) / 450;

  const renderedElements = useMemo<ProjectedElement[]>(() => {
    const projected: ProjectedElement[] = [];
    
    for (const el of elements) {
      let targetRotation = rotationY;
      let currentOpacity = el.opacity || 1;
      
      if (el.type === ShapeType.TWINKLE) {
        targetRotation = (rotationY * (el.rotationOffset || 0.1)) + (autoDrift * (el.rotationSpeed || 1));
        const phase = (el.rotationOffset || 0) * 100;
        const breathSpeed = 1.5 + (el.rotationSpeed || 1); 
        const breathFactor = (Math.sin(autoDrift * breathSpeed * 5 + phase) + 1) / 2;
        currentOpacity = (el.opacity || 0.5) * (0.3 + breathFactor * 0.7);
      }

      const proj = project(el.position, targetRotation, { x: centerX, y: centerY }, baseScale);
      projected.push({ ...el, ...proj, currentOpacity });
    }

    if (gameState === GameState.GIFT_APPEARED) {
      const giftProj = project(giftPosition, rotationY, { x: centerX, y: centerY }, baseScale);
      projected.push({
        id: 'THE_GIFT',
        type: ShapeType.GIFT,
        position: giftPosition,
        color: '',
        scale: 1,
        rotationOffset: 0,
        currentOpacity: 1,
        ...giftProj
      });
    }
    
    return projected.sort((a, b) => a.z - b.z);
  }, [elements, rotationY, autoDrift, centerX, centerY, baseScale, gameState, giftPosition]);

  return (
    <svg 
      width="100%" 
      height="100%" 
      className="absolute top-0 left-0 overflow-visible animate-fade-in"
      style={{ pointerEvents: 'none', willChange: 'transform' }}
    >
      <defs>
        {/* 精致强力发光滤镜 */}
        <filter id="gift-glow-magic" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur" />
          <feFlood floodColor="#ff4d4d" floodOpacity="0.9" result="color" />
          <feComposite in="color" in2="blur" operator="in" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes gift-jump-subtle {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(3deg); }
          }
          @keyframes glow-pulse {
            0%, 100% { opacity: 0.4; filter: brightness(1); }
            50% { opacity: 1; filter: brightness(1.4); }
          }
          .gift-jump-container {
            animation: gift-jump-subtle 3s ease-in-out infinite;
          }
          .gift-inner-glow {
            animation: glow-pulse 2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {renderedElements.map((el) => {
        if (!el) return null;

        const size = 18 * el.scale * el.perspective;

        if (el.type === ShapeType.STAR) {
          return (
            <g 
              key={el.id} 
              transform={`translate(${el.x}, ${el.y}) scale(${el.scale * el.perspective})`}
            >
              <text 
                x="0" y="0" 
                textAnchor="middle" 
                dominantBaseline="central" 
                fontSize="24" 
                fill={el.color}
                style={{ filter: 'drop-shadow(0 0 4px rgba(253, 224, 71, 0.6))' }}
              >
                ★
              </text>
            </g>
          );
        }

        if (el.type === ShapeType.TWINKLE) {
          return (
            <circle 
              key={el.id} 
              cx={el.x}
              cy={el.y}
              r={size} 
              fill={el.color} 
              fillOpacity={el.currentOpacity}
            />
          );
        }

        if (el.type === ShapeType.GIFT) {
          const giftSize = 24; 
          const ribbonWidth = giftSize / 8;
          return (
            <g 
              key={el.id} 
              transform={`translate(${el.x}, ${el.y}) scale(${el.perspective})`}
              style={{ 
                cursor: 'pointer', 
                pointerEvents: 'auto',
                filter: el.z < 0 ? 'brightness(0.7)' : 'none'
              }}
              onClick={(e) => { e.stopPropagation(); onGiftClick(); }}
            >
              <g className="gift-jump-container">
                {/* 增加背景魔法圆环 */}
                <circle r={giftSize * 0.9} fill="none" stroke="rgba(255, 77, 77, 0.2)" strokeWidth="1" strokeDasharray="2 2" className="gift-inner-glow" />
                
                <g filter="url(#gift-glow-magic)">
                  {/* 礼物盒主体 */}
                  <rect 
                    x={-giftSize/2} y={-giftSize/2} 
                    width={giftSize} height={giftSize} 
                    fill="#e11d48" rx="2.5" 
                  />
                  
                  {/* 细丝带 */}
                  <rect 
                    x={-ribbonWidth/2} y={-giftSize/2} 
                    width={ribbonWidth} height={giftSize} 
                    fill="#fff1f2" 
                  />
                  <rect 
                    x={-giftSize/2} y={-ribbonWidth/2} 
                    width={giftSize} height={ribbonWidth} 
                    fill="#fff1f2" 
                  />
                  
                  {/* 顶部蝴蝶结 */}
                  <g transform={`translate(0, ${-giftSize/2})`}>
                    {/* 左叶子 */}
                    <path 
                      d={`M 0 0 C -${giftSize/3} -${giftSize/3}, -${giftSize/2} 0, 0 0`} 
                      fill="#fff1f2" 
                      stroke="#fb7185" 
                      strokeWidth="0.5"
                    />
                    {/* 右叶子 */}
                    <path 
                      d={`M 0 0 C ${giftSize/3} -${giftSize/3}, ${giftSize/2} 0, 0 0`} 
                      fill="#fff1f2" 
                      stroke="#fb7185" 
                      strokeWidth="0.5"
                    />
                    {/* 蝴蝶结中心结 */}
                    <rect 
                      x={-ribbonWidth/1.5} y={-ribbonWidth/1.5} 
                      width={ribbonWidth*1.3} height={ribbonWidth*1.3} 
                      fill="#fff1f2" rx="1" 
                    />
                  </g>
                  
                  {/* 高光 */}
                  <circle cx={-giftSize/3} cy={-giftSize/3} r="1" fill="white" fillOpacity="0.9" />
                </g>
              </g>
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
