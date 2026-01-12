
import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { THEME_MAP } from '../../constants';

interface EmotionCoreProps {
  valence: number;
  isSelected?: boolean;
}

interface PetalLayerProps {
  valence: number;
  scale: number;
  rotationSpeed: number;
  opacity: number;
  thickness: number;
  layerIndex: number;
}

const PetalLayer: React.FC<PetalLayerProps> = ({ valence, scale, rotationSpeed, opacity, thickness, layerIndex }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  const roundedValence = Math.round(valence);
  const safeValence = Math.max(-3, Math.min(3, roundedValence));
  const currentTheme = THEME_MAP[safeValence];
  const color = useMemo(() => new THREE.Color(currentTheme.blobColor), [currentTheme.blobColor]);
  const accentColor = useMemo(() => new THREE.Color(currentTheme.accentColor), [currentTheme.accentColor]);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uValence: { value: valence },
    uLayerIndex: { value: layerIndex },
    uAccentColor: { value: accentColor },
    uBaseOpacity: { value: opacity }
  }), []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.scale.setScalar(scale + Math.sin(t * 0.3 + layerIndex) * 0.012);
      meshRef.current.rotation.y = t * rotationSpeed;
    }
    
    if (materialRef.current) {
      uniforms.uTime.value = t;
      uniforms.uValence.value = THREE.MathUtils.lerp(uniforms.uValence.value, valence, 0.08);
      uniforms.uAccentColor.value.lerp(accentColor, 0.08);
      uniforms.uBaseOpacity.value = THREE.MathUtils.lerp(uniforms.uBaseOpacity.value, opacity, 0.08);
      materialRef.current.color.lerp(color, 0.08);
      materialRef.current.emissive.lerp(color, 0.08);
    }
  });

  return (
    <mesh ref={meshRef} castShadow>
      <icosahedronGeometry args={[1, 100]} />
      <meshPhysicalMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.15}
        transparent
        opacity={opacity}
        // 降低透射率，让材质更显实体感，不那么像透明玻璃
        transmission={0.1} 
        thickness={thickness}
        // 增加粗糙度，让颜色看起来更“实在”，不那么轻飘
        roughness={0.4} 
        metalness={0.0}
        ior={1.4}
        clearcoat={0.6}
        clearcoatRoughness={0.2}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = uniforms.uTime;
          shader.uniforms.uValence = uniforms.uValence;
          shader.uniforms.uLayerIndex = uniforms.uLayerIndex;
          shader.uniforms.uAccentColor = uniforms.uAccentColor;
          shader.uniforms.uBaseOpacity = uniforms.uBaseOpacity;
          
          shader.vertexShader = `
            uniform float uTime;
            uniform float uValence;
            uniform float uLayerIndex;
            varying float vHeight;
            varying float vDist;

            ${shader.vertexShader}
          `.replace(
            `#include <begin_vertex>`,
            `
            float bloom = clamp((uValence + 3.0) / 6.0, 0.0, 1.0);
            float angle = atan(position.x, position.z);
            float h = position.y;

            float petalCount = 7.0 + uLayerIndex * 1.5;
            
            float sharpness = mix(12.0, 1.1, bloom);
            float petalShape = pow(abs(sin(angle * petalCount * 0.5)), sharpness);
            
            float vFactor = smoothstep(-0.8, 0.7, h);
            float opening = vFactor * petalShape * (0.25 + bloom * 0.65);
            
            float taper = smoothstep(0.0, -1.0, h) * 0.45;
            
            vec3 transformed = position;
            transformed.xz *= (1.0 + opening);
            transformed.xz *= (1.0 - taper);
            transformed.y *= 0.75; 

            vHeight = h;
            vDist = petalShape;
            `
          );

          shader.fragmentShader = `
            varying float vHeight;
            varying float vDist;
            uniform vec3 uAccentColor;
            uniform float uBaseOpacity;
            ${shader.fragmentShader}
          `.replace(
            `#include <dithering_fragment>`,
            `
            #include <dithering_fragment>
            
            float gradFactor = smoothstep(-0.8, 0.8, vHeight);
            
            gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.7, gl_FragColor.rgb * 1.3, gradFactor);
            
            gl_FragColor.rgb += pow(vDist, 4.0) * uAccentColor * 0.4;
            
            float alphaGrad = smoothstep(-1.0, -0.7, vHeight);
            gl_FragColor.a = uBaseOpacity * alphaGrad;

            gl_FragColor.rgb *= (0.8 + 0.2 * smoothstep(-1.0, 0.4, vHeight));
            `
          );
        }}
      />
    </mesh>
  );
};

const EmotionCore: React.FC<EmotionCoreProps> = ({ valence, isSelected }) => {
  if (!isSelected) {
    return (
      <mesh>
        <sphereGeometry args={[0.65, 64, 64]} />
        <meshPhysicalMaterial 
          transparent 
          opacity={0.6} 
          transmission={0.4} 
          thickness={1} 
          roughness={0.2} 
          metalness={0.0}
          color="#ffffff"
          ior={1.4}
        />
      </mesh>
    );
  }

  return (
    <group>
      {/* 调高各层不透明度，使颜色更实在 */}
      <PetalLayer valence={valence} scale={0.85} rotationSpeed={0.02} opacity={0.6} thickness={1.2} layerIndex={0} />
      <PetalLayer valence={valence} scale={0.65} rotationSpeed={-0.015} opacity={0.8} thickness={1.8} layerIndex={1} />
      <PetalLayer valence={valence} scale={0.45} rotationSpeed={0.03} opacity={1.0} thickness={2.5} layerIndex={2} />
      <mesh scale={0.04} position={[0, 0.05, 0]}>
        <icosahedronGeometry args={[1, 4]} />
        <meshBasicMaterial color="white" transparent opacity={0.95} />
      </mesh>
    </group>
  );
};

export default EmotionCore;
