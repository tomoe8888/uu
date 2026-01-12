
import React, { useMemo, useEffect, useState } from 'react';
import * as THREE_LIB from 'three';
import { ThemeColors } from '../../types';

interface RingBandProps {
  userImage: string | null;
  theme: ThemeColors;
}

const RingBand: React.FC<RingBandProps> = ({ userImage, theme }) => {
  const defaultTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 512, 0);
      grad.addColorStop(0, '#0f172a');
      grad.addColorStop(0.5, '#334155');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);
      
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.03})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, 1, 1);
      }
    }
    const tex = new THREE_LIB.CanvasTexture(canvas);
    tex.wrapS = THREE_LIB.RepeatWrapping;
    return tex;
  }, []);

  const [texture, setTexture] = useState<THREE_LIB.Texture>(defaultTexture);

  useEffect(() => {
    if (userImage) {
      const loader = new THREE_LIB.TextureLoader();
      loader.load(userImage, (loadedTex) => {
        loadedTex.wrapS = THREE_LIB.RepeatWrapping;
        loadedTex.repeat.set(2, 1);
        setTexture(loadedTex);
      });
    } else {
      setTexture(defaultTexture);
    }
  }, [userImage, defaultTexture]);

  return (
    <mesh rotation={[0, 0, 0]} receiveShadow>
      {/* Slightly smaller band radius to sit just inside the spheres */}
      <sphereGeometry args={[2.8, 64, 32, 0, Math.PI * 2, Math.PI * 0.42, Math.PI * 0.16]} />
      <meshPhysicalMaterial 
        map={texture}
        side={THREE_LIB.DoubleSide}
        transparent
        opacity={0.6}
        roughness={0.2}
        metalness={0.5}
        emissive={new THREE_LIB.Color(theme.blobColor)}
        emissiveIntensity={0.2}
        transmission={0.4}
        thickness={0.5}
      />
    </mesh>
  );
};

export default RingBand;
