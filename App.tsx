import React, { useState, useEffect, useRef, useMemo } from 'react';
import Scene from './components/Scene';
import { useOrientation } from './hooks/useOrientation';
import { GameState } from './types';

const GIFT_DELAY_MS = 5000;

// Physics constants for the rotation
const FRICTION = 0.96; // Slows down the rotation over time (0 to 1)
const ACCEL_FACTOR = 0.0015; // How much tilt affects speed
const MAX_VELOCITY = 0.15; // Limit maximum spin speed

const ScatteredLetters = ({ text, className }: { text: string; className?: string }) => {
  const letters = useMemo(() => {
    return text.split('').map((char, i) => ({
      char,
      key: i,
      rotation: (Math.random() - 0.5) * 8, 
      yOffset: (Math.random() - 0.5) * 6, 
    }));
  }, [text]);

  return (
    <span className={`inline-flex flex-nowrap justify-center ${className}`}>
      {letters.map(({ char, key, rotation, yOffset }) => (
        <span
          key={key}
          className="inline-block transition-transform duration-700 ease-out hover:scale-110"
          style={{
            transform: `rotate(${rotation}deg) translateY(${yOffset}px)`,
            margin: '0 1px'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>(GameState.WAITING_PERMISSION);
  const { orientation, requestPermission, hasPermission } = useOrientation(true);
  
  // Physics refs
  const currentRotationRef = useRef(0);
  const velocityRef = useRef(0);
  const [renderRotation, setRenderRotation] = useState(0);

  const isPrizeRevealed = useMemo(() => {
    const now = new Date();
    // Month is 0-indexed (11 is December)
    return now.getMonth() === 11 && now.getDate() >= 20;
  }, []);
  
  // Continuous Physics Loop
  useEffect(() => {
    let frameId: number;

    const loop = () => {
      if (gameState === GameState.WAITING_PERMISSION) {
        frameId = requestAnimationFrame(loop);
        return;
      }

      // 1. Calculate Acceleration based on phone tilt (gamma: -45 to 45)
      const accel = orientation.gamma * ACCEL_FACTOR;
      
      // 2. Update Velocity: Apply friction and add acceleration
      velocityRef.current = velocityRef.current * FRICTION + accel;
      
      // 3. Clamp Velocity
      if (velocityRef.current > MAX_VELOCITY) velocityRef.current = MAX_VELOCITY;
      if (velocityRef.current < -MAX_VELOCITY) velocityRef.current = -MAX_VELOCITY;

      // 4. Update current rotation angle
      currentRotationRef.current += velocityRef.current;
      
      setRenderRotation(currentRotationRef.current);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [orientation.gamma, gameState]);

  useEffect(() => {
    if (gameState === GameState.TREE_VIEW) {
      const timer = setTimeout(() => {
        setGameState(GameState.GIFT_APPEARED);
      }, GIFT_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  const handleStart = async () => {
    await requestPermission();
    setGameState(GameState.TREE_VIEW);
  };

  const handleGiftClick = () => {
    setGameState(GameState.EXPLODED);
  };

  return (
    <div className="relative w-full h-screen bg-white overflow-hidden font-sans text-gray-800 select-none">
      
      {/* 3D Scene Layer */}
      {(gameState !== GameState.WAITING_PERMISSION) && (
        <>
          <Scene 
            gameState={gameState} 
            rotationY={renderRotation} 
            onGiftClick={handleGiftClick} 
          />
          
          {/* Static Bottom Text */}
          <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center pointer-events-none animate-fade-in-slow">
            <h1 className="font-festive text-3xl sm:text-5xl text-red-600/70 mb-1">
              Merry Christmas
            </h1>
            <p className="text-gray-300 text-[10px] tracking-[0.3em] font-light">
              2025.12.25
            </p>
          </div>
        </>
      )}

      {/* UI Overlay: Intro / Permission */}
      {gameState === GameState.WAITING_PERMISSION && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/98 backdrop-blur-sm p-6 text-center overflow-hidden">
          <div className="font-festive text-red-600/90 mb-12 select-none pointer-events-none w-full animate-seq-1 opacity-0">
             {/* Balanced "Merry" and "Christmas" sizes to ensure display on mobile */}
             <div className="text-3xl sm:text-6xl leading-tight whitespace-nowrap">
               <ScatteredLetters text="Merry" />
             </div>
             <div className="text-3xl sm:text-6xl leading-tight mt-1 whitespace-nowrap">
               <ScatteredLetters text="Christmas" />
             </div>
          </div>

          <p className="text-base sm:text-lg text-gray-400 mb-12 max-w-xs font-light tracking-widest relative z-10 animate-seq-2 opacity-0">
            晃动手机探索圣诞树<br/>开启属于你的冬日惊喜
          </p>
          
          <div className="animate-seq-3 opacity-0 relative z-10">
            <button 
              onClick={handleStart}
              className="px-14 py-3 bg-white text-gray-500 text-[10px] tracking-[0.4em] uppercase font-light rounded-full shadow-sm hover:shadow-md border border-gray-50 transform transition active:scale-95 animate-pulse-slow"
            >
              开启祝福
            </button>
          </div>
          <p className="mt-10 text-[9px] text-gray-300 opacity-0 relative z-10 animate-seq-4 uppercase tracking-tighter">
            *需要访问重力感应权限
          </p>
        </div>
      )}

      {/* UI Overlay: Hint */}
      {gameState === GameState.GIFT_APPEARED && (
        <div className="absolute top-28 left-0 right-0 text-center pointer-events-none animate-bounce">
          <p className="text-gray-300 text-[10px] tracking-widest font-light uppercase">
            Look closer at the tree
          </p>
        </div>
      )}

      {/* UI Overlay: Win Message (Explosion) */}
      {gameState === GameState.EXPLODED && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 pointer-events-none bg-white/50 backdrop-blur-[1px]">
          <div className="animate-pop-in opacity-0 flex flex-col items-center transform origin-center">
            {isPrizeRevealed ? (
              <>
                <h2 className="text-3xl font-bold text-red-600 mb-4 text-center leading-tight tracking-tight">
                  马上打开淘宝
                </h2>
                <div className="w-10 h-[1px] bg-red-100 mb-6"></div>
                <h2 className="text-xl sm:text-2xl font-light text-gray-800 text-center leading-relaxed max-w-xs">
                  帮你下单购物车中<br/>
                  <span className="font-medium text-red-500">任意一件或几件</span><br/>
                  总和100元左右的商品
                </h2>
                <div className="mt-20 opacity-0 animate-[fadeIn_1s_ease-out_1.5s_forwards]">
                   <p className="text-gray-300 text-[10px] tracking-widest uppercase">截图保存这份好运</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-light text-red-500 mb-4 text-center tracking-widest uppercase">
                  发现惊喜
                </h2>
                <div className="w-10 h-[1px] bg-red-100 mb-6"></div>
                <h2 className="text-4xl sm:text-6xl font-festive text-gray-800 text-center leading-tight">
                  神秘大礼<br/>12.20 揭晓
                </h2>
                <div className="mt-20 opacity-0 animate-[fadeIn_1s_ease-out_1.5s_forwards]">
                   <p className="text-gray-300 text-[10px] tracking-widest uppercase">记得在那天回来看看</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }

        .animate-fade-in { animation: fadeIn 2s ease-out forwards; }
        .animate-fade-in-slow { animation: fadeIn 3s ease-out 1.5s forwards; opacity: 0; }
        .animate-seq-1 { animation: fadeInUp 1s ease-out 0.2s forwards; }
        .animate-seq-2 { animation: fadeInUp 1s ease-out 0.7s forwards; }
        .animate-seq-3 { animation: fadeInUp 1s ease-out 1.2s forwards; }
        .animate-seq-4 { animation: fadeInUp 1s ease-out 1.7s forwards; }
        .animate-pop-in { animation: popIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
