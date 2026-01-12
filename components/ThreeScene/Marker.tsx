
import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Html, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { TimelineNode } from '../../types';

interface MarkerProps {
  node: TimelineNode;
  isSelected: boolean;
  onSelect: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

const Marker: React.FC<MarkerProps> = ({ node, isSelected, onSelect, onHoverChange }) => {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  // Orbital radius calculation
  const radius = 3.0; 
  const angle = (node.longitude * Math.PI) / 180;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  useEffect(() => {
    if (node.imageUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(node.imageUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        tex.repeat.set(1, 1);
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.LinearFilter;
        tex.generateMipmaps = true;
        tex.needsUpdate = true;
        setTexture(tex);
      });
    } else {
      setTexture(null);
    }
  }, [node.imageUrl]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    
    if (groupRef.current) {
        // Floating motion
        groupRef.current.position.y = Math.sin(t * 0.5 + node.id) * 0.12;
    }

    const targetScale = (hovered || isSelected) ? 1.4 : 1.0;
    const lerpFactor = 0.1;

    if (meshRef.current) {
        meshRef.current.rotation.y += 0.002;
        meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), lerpFactor);
    }

    if (materialRef.current) {
        const pulse = Math.sin(t * 1.5) * 0.05;
        materialRef.current.emissiveIntensity = (texture ? 0.02 : 0.2) + pulse;
    }
  });

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    setHovered(true);
    onHoverChange?.(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHoverChange?.(false);
  };

  return (
    <group 
        ref={groupRef} 
        position={[x, 0, z]} 
        onClick={(e) => {
            e.stopPropagation();
            onSelect();
        }}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
    >
      {/* Central Memory Sphere - Reduced radius from 0.55 to 0.4 */}
      <mesh ref={meshRef} castShadow>
        <sphereGeometry args={[0.4, 64, 64]} />
        <meshPhysicalMaterial 
            ref={materialRef}
            color={texture ? "#ffffff" : "#f0f9ff"} 
            map={texture}
            emissive={texture ? "#000000" : "#dbeafe"}
            transmission={texture ? 0 : 0.9} 
            opacity={texture ? 1.0 : 0.8}
            transparent={!texture} 
            clearcoat={1.0}
            clearcoatRoughness={0.15}
            roughness={texture ? 0.3 : 0.05}
            metalness={0.0}
            envMapIntensity={texture ? 0.7 : 2.0}
            ior={1.45} 
            thickness={texture ? 0 : 2.5}
            iridescence={texture ? 0.2 : 0.8}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[100, 400]}
            specularIntensity={1.2}
        />
      </mesh>

      <Billboard position={[0, 1.1, 0]}>
        <Text
          fontSize={0.18}
          color="#334155"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          {`${node.year}/${node.id + 1}`}
        </Text>
      </Billboard>

      {(hovered || isSelected) && (
        <Html position={[0, 1.65, 0]} center distanceFactor={10}>
          <div className="bg-white/70 backdrop-blur-2xl text-slate-900 px-5 py-2.5 rounded-[20px] border border-white/50 whitespace-nowrap shadow-[0_15px_35px_rgba(0,0,0,0.08)] pointer-events-none transition-all scale-100">
            <div className="font-bold flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-slate-900 shadow-[0_0_8px_rgba(0,0,0,0.1)]"></span>
              {node.title}
            </div>
            {node.note && <p className="text-[9px] text-slate-500 mt-1 max-w-[130px] truncate">{node.note}</p>}
          </div>
        </Html>
      )}
    </group>
  );
};

export default Marker;
