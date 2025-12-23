
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Scene from './components/Scene';
import { useOrientation } from './hooks/useOrientation';
import { GameState } from './types';

const GIFT_DELAY_MS = 6000; 

// Physics constants
const FRICTION = 0.92; 
const ACCEL_FACTOR = 0.0006; 
const MAX_VELOCITY = 0.06; 

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
    return now.getMonth() === 11 && now.getDate() >= 20;
  }, []);
  
  useEffect(() => {
    let frameId: number;
    const loop = () => {
      if (gameState === GameState.WAITING_PERMISSION) {
        frameId = requestAnimationFrame(loop);
        return;
      }
      const accel = orientation.gamma * ACCEL_FACTOR;
      velocityRef.current = velocityRef.current * FRICTION + accel;
      if (velocityRef.current > MAX_VELOCITY) velocityRef.current = MAX_VELOCITY;
      if (velocityRef.current < -MAX_VELOCITY) velocityRef.current = -MAX_VELOCITY;
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
          
          {/* Static Bottom Text Container - Moved up from bottom-12 to bottom-24 */}
          <div className={`absolute bottom-24 left-0 right-0 flex flex-col items-center pointer-events-none transition-opacity duration-1000 ${gameState === GameState.EXPLODED ? 'opacity-0' : 'animate-fade-in-slow'}`}>
            {gameState === GameState.GIFT_APPEARED && (
              <div className="mb-8 animate-bounce">
                <p className="text-gray-400 text-[11px] tracking-[0.2em] font-light">
                  快看，树上有什么！
                </p>
              </div>
            )}
            <h1 className="font-festive text-3xl sm:text-5xl text-red-600/70 mb-1">
              Merry Christmas
            </h1>
          </div>
        </>
      )}

      {/* Intro UI */}
      {gameState === GameState.WAITING_PERMISSION && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white/98 backdrop-blur-sm p-6 text-center overflow-hidden">
          <div className="font-festive text-red-600/90 mb-12 select-none pointer-events-none w-full animate-seq-1 opacity-0">
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

      {/* Win Message (Explosion) */}
      {gameState === GameState.EXPLODED && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4 pointer-events-none bg-transparent">
          <div className="flex flex-col items-center">
            {isPrizeRevealed ? (
              <>
                <h2 className="text-3xl font-bold text-red-600 mb-4 text-center leading-tight tracking-tight reveal-1">
                  马上打开淘宝
                </h2>
                <div className="w-10 h-[1px] bg-red-200 mb-8 reveal-2"></div>
                
                <div className="flex flex-col items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-light text-gray-800 text-center leading-tight reveal-3">
                    帮你下单购物车中
                  </h2>
                  <h2 className="text-xl sm:text-2xl font-medium text-red-500 text-center leading-tight reveal-4">
                    任意一件或几件
                  </h2>
                  <h2 className="text-xl sm:text-2xl font-light text-gray-800 text-center leading-tight reveal-5">
                    总和100元左右的商品
                  </h2>
                </div>

                <div className="mt-20 reveal-6">
                   <p className="text-gray-400 text-[10px] tracking-widest uppercase opacity-60">截图保存这份好运</p>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-light text-red-500 mb-6 text-center tracking-widest uppercase reveal-1">
                  发现惊喜
                </h2>
                <div className="w-10 h-[1px] bg-red-100 mb-8 reveal-2"></div>
                <h2 className="text-4xl sm:text-6xl font-festive text-gray-800 text-center leading-tight reveal-3">
                  神秘大礼
                </h2>
                <h2 className="text-4xl sm:text-6xl font-festive text-gray-800 text-center leading-tight mt-2 reveal-4">
                  12.20 揭晓
                </h2>
                <div className="mt-20 reveal-5">
                   <p className="text-gray-400 text-[10px] tracking-widest uppercase opacity-60">记得在那天回来看看</p>
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
        
        /* Sequential Line Reveals */
        .reveal-1 { animation: fadeInUp 0.8s ease-out 0.3s forwards; opacity: 0; }
        .reveal-2 { animation: fadeInUp 0.8s ease-out 0.7s forwards; opacity: 0; }
        .reveal-3 { animation: fadeInUp 0.8s ease-out 1.1s forwards; opacity: 0; }
        .reveal-4 { animation: fadeInUp 0.8s ease-out 1.5s forwards; opacity: 0; }
        .reveal-5 { animation: fadeInUp 0.8s ease-out 1.9s forwards; opacity: 0; }
        .reveal-6 { animation: fadeInUp 0.8s ease-out 2.5s forwards; opacity: 0; }

        .animate-pulse-slow { animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}
