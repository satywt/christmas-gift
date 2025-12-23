import { useState, useEffect } from 'react';

interface Orientation {
  gamma: number; // Left/Right tilt (-90 to 90)
}

export const useOrientation = (enabled: boolean) => {
  const [orientation, setOrientation] = useState<Orientation>({ gamma: 0 });
  const [hasPermission, setHasPermission] = useState(false);

  // Function to request permission (iOS 13+)
  const requestPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          setHasPermission(true);
        } else {
          console.warn("Permission denied");
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      // Non-iOS or older devices usually don't need explicit permission
      setHasPermission(true);
    }
  };

  useEffect(() => {
    if (!enabled || !hasPermission) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      // Gamma is usually left/right tilt on phones held in portrait
      // Clamping to avoid extreme rotations
      const g = Math.max(-45, Math.min(45, event.gamma || 0));
      setOrientation({ gamma: g });
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [enabled, hasPermission]);

  // Fallback for desktop mouse movement
  useEffect(() => {
    if (!enabled) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const width = window.innerWidth;
      // Map mouse X to -45 to 45 degree tilt
      const normalizedX = (e.clientX / width) * 2 - 1; // -1 to 1
      setOrientation({ gamma: normalizedX * 45 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enabled]);

  return { orientation, requestPermission, hasPermission };
};
