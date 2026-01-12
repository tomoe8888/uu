
import React, { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { VisualizationState, TimelineNode } from '../types';
import Marker from './ThreeScene/Marker';
import EmotionCore from './ThreeScene/EmotionCore';

interface SpiralVisualizationProps {
  state: VisualizationState;
  onSegmentClick: (id: number) => void;
  nodes: TimelineNode[];
  selectedNodeId: number | null;
  onNodeClick: (id: number) => void;
  autoRotate: boolean;
  isFocused: boolean;
}

const FrostedCylinder: React.FC<{ height: number; radius: number }> = ({ height, radius }) => {
  const points = useMemo(() => {
    const pts = [];
    const wallThickness = 0.08;
    pts.push(new THREE.Vector2(radius - wallThickness, height / 2));
    pts.push(new THREE.Vector2(radius - wallThickness, -height / 2 + wallThickness));
    pts.push(new THREE.Vector2(0, -height / 2 + wallThickness));
    pts.push(new THREE.Vector2(0, -height / 2));
    pts.push(new THREE.Vector2(radius, -height / 2));
    pts.push(new THREE.Vector2(radius, height / 2));
    return pts;
  }, [height, radius]);

  return (
    <mesh renderOrder={2}>
      <latheGeometry args={[points, 128]} />
      <meshPhysicalMaterial
        transparent
        transmission={1.0}
        thickness={2.5}
        roughness={0.08}
        metalness={0.02}
        ior={1.52}
        clearcoat={1.0}
        clearcoatRoughness={0.05}
        opacity={0.15}
        color="#f0f9ff"
        side={THREE.DoubleSide}
        depthWrite={false}
        envMapIntensity={1.5}
      />
    </mesh>
  );
};

// Component for Counter-Rotating Iridescent Glass/Metal Rings
const CounterRotatingRings: React.FC<{ radius: number; count: number }> = ({ radius, count }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Rotate in opposite direction to markers
      groupRef.current.rotation.y -= delta * 0.15;
    }
  });

  const rings = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return { x, z, angle };
    });
  }, [radius, count]);

  return (
    <group ref={groupRef}>
      {rings.map((ring, i) => (
        <mesh 
          key={i} 
          position={[ring.x, 0, ring.z]} 
          rotation={[0, -ring.angle, 0]} 
          castShadow
        >
          {/* Much thinner ring geometry: tube radius reduced from 0.12 to 0.04 */}
          <torusGeometry args={[0.82, 0.04, 32, 128]} />
          <meshPhysicalMaterial 
            color="#f8fafc" // Bright, clean base
            transmission={0.7} // High translucency for "透亮" effect
            thickness={0.5} 
            ior={1.9} // Higher IOR for more brilliant refraction
            roughness={0.02} // Polished, smooth surface
            metalness={0.8} // Maintains the metallic glint
            clearcoat={1.0}
            clearcoatRoughness={0.0}
            iridescence={1.0} 
            iridescenceIOR={2.4} 
            iridescenceThicknessRange={[100, 900]} 
            envMapIntensity={3.5} // High intensity to catch the surrounding lights
            attenuationDistance={0.5}
            attenuationColor="#ffffff"
            specularIntensity={2.0}
          />
        </mesh>
      ))}
    </group>
  );
};

const ContinuousSpiral: React.FC<SpiralVisualizationProps> = ({ state, onSegmentClick, nodes, selectedNodeId, onNodeClick, isFocused }) => {
  const { frequencies, duration, segments, showContainer } = state;
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const orbitalGroupRef = useRef<THREE.Group>(null);
  const elementsGroupRef = useRef<THREE.Group>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);
  
  const radius = 2.4; 
  const markerRadius = 3.0;
  const height = duration * 2.2;
  const tubularSegments = 2400; 
  const radialSegments = 24;

  const curve = useMemo(() => {
    const pathPoints = [];
    const totalPoints = 1500; 
    const turnsPerPeriod = frequencies.map(f => {
      const baseTurnsPerYear = Math.max(0.8, 160 / Math.pow(f, 0.85));
      return (duration / 5) * baseTurnsPerYear;
    });

    const getAngleAt = (t: number) => {
      const scaledT = t * 5;
      const periodIdx = Math.min(Math.floor(scaledT), 4);
      const fracInPeriod = scaledT - periodIdx;
      let angle = 0;
      for (let i = 0; i < periodIdx; i++) {
        angle += turnsPerPeriod[i] * Math.PI * 2;
      }
      angle += fracInPeriod * turnsPerPeriod[periodIdx] * Math.PI * 2;
      return angle;
    };

    for (let i = 0; i <= totalPoints; i++) {
      const t = i / totalPoints;
      const angle = getAngleAt(t);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = (height / 2) - (t * height);
      pathPoints.push(new THREE.Vector3(x, y, z));
    }
    return new THREE.CatmullRomCurve3(pathPoints);
  }, [frequencies, duration, height, radius]);

  const geometry = useMemo(() => {
    const geo = new THREE.TubeGeometry(curve, tubularSegments, 0.18, radialSegments, false);
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const colorObjs = segments.map(s => new THREE.Color(s.color));
    const uv = geo.attributes.uv;
    
    for (let i = 0; i < count; i++) {
      const u = uv.getX(i); 
      const idx = Math.min(Math.floor(u * segments.length), segments.length - 1);
      const targetColor = colorObjs[idx];
      colors[i * 3] = targetColor.r;
      colors[i * 3 + 1] = targetColor.g;
      colors[i * 3 + 2] = targetColor.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [curve, segments]);

  useFrame((state, delta) => {
    if (orbitalGroupRef.current) {
      orbitalGroupRef.current.rotation.y += delta * 0.15;
    }

    if (elementsGroupRef.current) {
        const targetY = isFocused ? 0 : (height / 2) + 3.8;
        const targetRotationX = isFocused ? 0 : Math.PI / 6;
        const targetScale = isFocused ? 2.2 : 1.7;

        elementsGroupRef.current.position.y = THREE.MathUtils.lerp(elementsGroupRef.current.position.y, targetY, 0.1);
        elementsGroupRef.current.rotation.x = THREE.MathUtils.lerp(elementsGroupRef.current.rotation.x, targetRotationX, 0.1);
        
        const s = THREE.MathUtils.lerp(elementsGroupRef.current.scale.x, targetScale, 0.1);
        elementsGroupRef.current.scale.set(s, s, s);
    }
  });

  const activeNodeId = hoveredNodeId ?? selectedNodeId;
  const activeNode = nodes.find(n => n.id === activeNodeId);
  const currentValence = activeNode?.valence ?? 0;

  return (
    <group>
      {!isFocused && showContainer && <FrostedCylinder height={height + 1.2} radius={radius + 1.0} />}
      
      {!isFocused && (
        <mesh 
          geometry={geometry}
          onClick={(e) => {
            if (e.uv) {
              e.stopPropagation();
              const u = e.uv.x;
              const segmentId = Math.floor(u * segments.length);
              onSegmentClick(Math.min(segmentId, segments.length - 1));
            }
          }}
          renderOrder={1}
        >
          <meshPhysicalMaterial 
            ref={materialRef}
            vertexColors={true}
            emissive="#ffffff"
            emissiveIntensity={0.12} 
            transmission={0.88} 
            thickness={2.2} 
            roughness={0.015} 
            metalness={0.05} 
            ior={1.48}
            transparent
            opacity={1.0}
          />
        </mesh>
      )}

      <group 
        ref={elementsGroupRef}
        position={[0, (height / 2) + 3.8, 0]} 
        scale={1.7}
        rotation={[Math.PI / 6, 0, Math.PI / 16]}
      >
         <EmotionCore valence={currentValence} isSelected={activeNodeId !== null} />
         
         {/* Forward Rotating Markers (Memory Spheres) */}
         <group ref={orbitalGroupRef}>
           {nodes.map((node) => (
              <Marker 
                key={node.id} 
                node={node} 
                isSelected={selectedNodeId === node.id}
                onSelect={() => onNodeClick(node.id)} 
                onHoverChange={(isHovered) => setHoveredNodeId(isHovered ? node.id : null)}
              />
           ))}
         </group>

         {/* Backward Rotating Iridescent Rings - Fixed to 12 as per user request */}
         <CounterRotatingRings radius={markerRadius} count={12} />
      </group>
    </group>
  );
};

const Scene: React.FC<SpiralVisualizationProps & { isSpacePressed: boolean }> = (props) => {
  return (
    <>
      <PerspectiveCamera makeDefault position={[22, 12, 32]} fov={30} />
      <OrbitControls 
        autoRotate={props.isSpacePressed ? false : props.autoRotate}
        autoRotateSpeed={0.4}
        enableDamping 
        dampingFactor={0.05} 
        rotateSpeed={0.5}
        minDistance={props.isFocused ? 5 : 10}
        maxDistance={80}
        // Pan mapping: Map Left-click to Pan when Space is held
        mouseButtons={{
          LEFT: props.isSpacePressed ? THREE.MOUSE.PAN : THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN
        }}
        screenSpacePanning={true}
      />
      
      <ambientLight intensity={0.6} /> 
      <pointLight position={[20, 30, 20]} intensity={2.5} color="#ffffff" />
      
      <Float speed={0.4} rotationIntensity={0.01} floatIntensity={0.02}>
        <ContinuousSpiral {...props} />
      </Float>
      
      <ContactShadows 
        opacity={0.06} 
        scale={50} 
        blur={4} 
        far={20} 
        resolution={1024} 
        color="#000000" 
        position={[0, -props.state.duration - 2.5, 0]}
      />
      <Environment preset="studio" environmentIntensity={0.9} />
    </>
  );
};

const SpiralVisualization: React.FC<SpiralVisualizationProps> = (props) => {
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(true);
        // Prevent default space behavior like scrolling
        if (document.activeElement === document.body) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div 
      className="w-full h-full relative bg-[#F7F9FB]" 
      style={{ cursor: isSpacePressed ? 'grab' : 'auto' }}
    > 
      <Canvas 
        shadows 
        dpr={[1, 2]} 
        gl={{ 
          antialias: true, 
          alpha: true,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        <Suspense fallback={null}>
            <Scene {...props} isSpacePressed={isSpacePressed} />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default SpiralVisualization;
