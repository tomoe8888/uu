
import React, { Suspense, useState, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import { TimelineNode, Valence } from '../../types';
import Marker from './Marker';
import EmotionCore from './EmotionCore';

interface Scene3DProps {
  nodes: TimelineNode[];
  autoRotate: boolean;
  selectedNodeId: number | null;
  onNodeClick: (id: number) => void;
}

const Scene3D: React.FC<Scene3DProps> = ({ nodes, autoRotate, selectedNodeId, onNodeClick }) => {
  const [hoveredNodeId, setHoveredNodeId] = useState<number | null>(null);

  // The "active" node for the central core is the hovered one (for preview) 
  // or the selected one (for focus).
  const activeNodeId = hoveredNodeId ?? selectedNodeId;
  const activeNode = nodes.find(n => n.id === activeNodeId);
  const currentValence = activeNode?.valence ?? Valence.NEUTRAL;
  const showFlower = activeNodeId !== null;

  return (
    <Canvas dpr={[1, 2]} shadows gl={{ antialias: true, alpha: true }}>
      <PerspectiveCamera makeDefault position={[0, 4, 10]} fov={45} />
      <OrbitControls 
        autoRotate={autoRotate}
        autoRotateSpeed={0.4}
        enableDamping
        dampingFactor={0.05}
        minDistance={6}
        maxDistance={18}
        maxPolarAngle={Math.PI / 1.5}
        minPolarAngle={Math.PI / 4}
      />
      
      <Suspense fallback={null}>
        <ambientLight intensity={0.8} />
        <spotLight position={[10, 20, 10]} angle={0.2} penumbra={1} intensity={2} castShadow color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#e0e7ff" />
        
        <group position={[0, 0, 0]}>
          {/* Central Emotional Core - active when hovered or selected */}
          <EmotionCore valence={currentValence} isSelected={showFlower} />

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

        <Environment preset="city" />
        <ContactShadows 
          opacity={0.15} 
          scale={20} 
          blur={3} 
          far={10} 
          resolution={512} 
          color="#000000" 
        />
      </Suspense>
    </Canvas>
  );
};

export default Scene3D;
