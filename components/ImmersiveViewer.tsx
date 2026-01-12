
import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { X } from 'lucide-react';
import { TimelineNode } from '../types';

interface ImmersiveViewerProps {
  node: TimelineNode;
  onClose: () => void;
}

const PanoramaScene: React.FC<{ url: string }> = ({ url }) => {
  const texture = useTexture(url);
  // 确保纹理能够平滑映射
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;

  return (
    <group>
      {/* 巨大的全景球体，args: [半径, 经度分段, 纬度分段] */}
      <Sphere args={[500, 64, 64]}>
        <meshBasicMaterial 
          map={texture} 
          side={THREE.BackSide} 
        />
      </Sphere>
    </group>
  );
};

const ImmersiveViewer: React.FC<ImmersiveViewerProps> = ({ node, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black animate-in fade-in duration-1000 overflow-hidden">
      
      {/* 3D Panorama Layer */}
      <div className="absolute inset-0 z-0">
        {node.imageUrl ? (
          <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
            <Suspense fallback={null}>
              <PanoramaScene url={node.imageUrl} />
              <OrbitControls 
                enableZoom={false} 
                enablePan={false} 
                autoRotate 
                autoRotateSpeed={0.5}
                rotateSpeed={-0.5} // 反向旋转使拖拽更自然
              />
            </Suspense>
          </Canvas>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-black flex items-center justify-center">
            <p className="text-white/20 font-bold tracking-widest uppercase">No Visual Data</p>
          </div>
        )}
      </div>

      {/* Floating UI Overlays - Top Left Alignment */}
      <div className="relative z-10 w-full h-full pointer-events-none p-10 flex flex-col items-start justify-start gap-4">
        
        <div className="flex flex-col items-start gap-4 w-full max-w-md mt-4 ml-4">
            {/* Title Bubble - Reduced Size */}
            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 px-6 py-3 rounded-[24px] shadow-[0_10px_30px_rgba(0,0,0,0.2)] pointer-events-auto animate-float-slow">
                <h2 className="text-white text-xl md:text-2xl font-bold tracking-tight drop-shadow-md">
                  {node.title}
                </h2>
            </div>
            
            {/* Note Bubble - Reduced Size */}
            {node.note && (
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 px-8 py-5 rounded-[24px] shadow-2xl pointer-events-auto animate-float-delayed">
                    <p className="text-white/90 text-sm md:text-base leading-relaxed font-light italic">
                        "{node.note}"
                    </p>
                    <div className="h-[1px] w-12 bg-gradient-to-r from-white/30 to-transparent mt-4" />
                    <div className="text-white/40 text-[9px] font-bold uppercase tracking-[0.4em] mt-3">
                       MEMO • {node.month} {node.year}
                    </div>
                </div>
            )}
        </div>

        {/* Interaction Hint - Stay at Bottom Center */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-3">
          <div className="w-8 h-[1px] bg-white/20" />
          Drag to explore
          <div className="w-8 h-[1px] bg-white/20" />
        </div>
      </div>

      {/* Close UI - Top Right */}
      <button 
        onClick={onClose}
        className="absolute top-10 right-10 p-5 bg-black/20 hover:bg-white/10 backdrop-blur-xl rounded-full text-white border border-white/10 transition-all active:scale-90 group z-[110]"
      >
        <X className="w-7 h-7 group-hover:rotate-90 transition-transform duration-500" />
      </button>

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(-8px) rotate(0.5deg); }
          66% { transform: translateY(4px) rotate(-0.5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          33% { transform: translateY(6px) rotate(-0.8deg); }
          66% { transform: translateY(-6px) rotate(0.8deg); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 10s ease-in-out infinite;
          animation-delay: -2s;
        }
      `}</style>
    </div>
  );
};

export default ImmersiveViewer;
