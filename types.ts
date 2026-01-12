
import { ThreeElements } from '@react-three/fiber';

// Removed the manual JSX.IntrinsicElements augmentation block. 
// In modern React 18+ and Vite environments, standard HTML elements are provided by @types/react.
// React Three Fiber elements like <mesh> and <group> are typically handled automatically 
// by the library's own type definitions. The manual declaration here was inadvertently 
// replacing the global JSX namespace instead of merging with it, which caused 
// standard elements like <div> and <span> to become unrecognized.

export interface SegmentData {
  id: number;
  color: string;
  label: string;
}

export interface VisualizationState {
  frequencies: number[]; 
  periodHues: number[]; 
  duration: number; 
  currentColor: string;
  segments: SegmentData[];
  showContainer: boolean;
  nodeCount: number;
  segmentBrushSize: number;
}

export enum Valence {
  VERY_UNPLEASANT = -3,
  UNPLEASANT = -2,
  SLIGHTLY_UNPLEASANT = -1,
  NEUTRAL = 0,
  SLIGHTLY_PLEASANT = 1,
  PLEASANT = 2,
  VERY_PLEASANT = 3
}

export interface TimelineNode {
  id: number;
  month: string;
  year: number;
  title: string;
  note: string;
  longitude: number;
  valence: number;
  imageUrl: string | null;
}

export enum ViewMode {
  EDIT = 'EDIT',
  VIEW = 'VIEW'
}

export interface ThemeColors {
  bgGradient: string;
  blobColor: string;
  accentColor: string;
  emissiveIntensity: number;
}

export const getSegmentColor = (baseHue: number, index: number): string => {
  const hash = (n: number) => (Math.abs(Math.sin(n * 12.9898 + 78.233) * 43758.5453123) % 1);
  // Adjusted group divisor from 4.5 to 18 to maintain similar block size at 400 segments
  const groupIdx = Math.floor(index / 18); 
  const isPatchGroup = hash(groupIdx * 0.91) < 0.14; 
  
  let h: number;
  let s: number;
  let l: number;

  if (isPatchGroup) {
    const hueDiversify = hash(groupIdx * 1.5) * 360;
    h = (baseHue + 70 + hueDiversify) % 360;
    s = 100; 
    const isVibrantYellow = h > 40 && h < 75;
    const isVibrantGreen = h >= 75 && h < 165;
    const isVibrantBlue = h > 185 && h < 265;
    if (isVibrantYellow) l = 45; 
    else if (isVibrantGreen) l = 40;
    else if (isVibrantBlue) l = 44;
    else l = 48;
  } else {
    const jitter = (hash(groupIdx) * 12) - 6; 
    h = (baseHue + jitter + 360) % 360;
    s = 95; 
    const isBrightHue = h > 40 && h < 200;
    l = isBrightHue ? 46 : 53;
  }
  return `hsl(${h}, ${Math.round(s)}%, ${Math.round(l)}%)`;
};

// INITIAL_STATE export required by App.tsx
export const INITIAL_STATE: VisualizationState = {
  frequencies: [40, 60, 80, 100, 120],
  periodHues: [200, 160, 120, 80, 40],
  duration: 5,
  currentColor: '#ffffff',
  // Increased to 400 for better "Fragment Length" resolution
  segments: Array.from({ length: 400 }, (_, i) => ({
    id: i,
    color: getSegmentColor(200, i),
    label: `Segment ${i}`
  })),
  showContainer: true,
  nodeCount: 12,
  segmentBrushSize: 0.5,
};
