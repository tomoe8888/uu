
import { Valence, TimelineNode, ThemeColors } from './types';

export const MOOD_LEVELS = [
  { valence: -3, label: '非常に不快' },
  { valence: -2, label: 'とても不快' },
  { valence: -1, label: 'やや不快' },
  { valence: 0, label: 'どちらとも言えない' },
  { valence: 1, label: 'やや快適' },
  { valence: 2, label: 'とても快適' },
  { valence: 3, label: '非常に快適' },
];

export const THEME_MAP: Record<number, ThemeColors> = {
  [-3]: {
    bgGradient: 'from-[#e0def0] via-[#d1cde8] to-[#c2bddd]',
    blobColor: '#7b68ee', // Deep Purple
    accentColor: '#4a36b1',
    emissiveIntensity: 0.6
  },
  [-2]: {
    bgGradient: 'from-[#e2ebf5] via-[#d3e0ef] to-[#c4d5e9]',
    blobColor: '#6495ed', // Cornflower Blue
    accentColor: '#3a66b1',
    emissiveIntensity: 0.5
  },
  [-1]: {
    bgGradient: 'from-[#eaf6fe] via-[#d5effd] to-[#bfe8fc]',
    blobColor: '#00bfff', // Deep Sky Blue
    accentColor: '#007bb0',
    emissiveIntensity: 0.45
  },
  [0]: {
    bgGradient: 'from-[#f4fefc] via-[#e2fbf7] to-[#d0f9f2]',
    blobColor: '#20b2aa', // Light Sea Green
    accentColor: '#167d77',
    emissiveIntensity: 0.4
  },
  [1]: {
    bgGradient: 'from-[#f4fef6] via-[#e2fbe9] to-[#d0f9dc]',
    blobColor: '#32cd32', // Lime Green
    accentColor: '#218a21',
    emissiveIntensity: 0.45
  },
  [2]: {
    // Contrast Fix: Paler background, deeper/more saturated gold flower
    bgGradient: 'from-[#fffdf0] via-[#fffbeb] to-[#fff7d6]',
    blobColor: '#f9a825', // Rich Amber/Gold
    accentColor: '#c67c00',
    emissiveIntensity: 0.5
  },
  [3]: {
    bgGradient: 'from-[#fffaf5] via-[#fff3e6] to-[#ffead1]',
    blobColor: '#ff4500', // Orange Red
    accentColor: '#b33000',
    emissiveIntensity: 0.6
  }
};

export const INITIAL_NODES: TimelineNode[] = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  month: new Date(2024, i).toLocaleString('default', { month: 'long' }),
  year: 2024,
  title: `Memory of ${new Date(2024, i).toLocaleString('default', { month: 'short' })}`,
  note: 'A special fragment of time recorded in the orbit.',
  longitude: (i * 30),
  valence: 0,
  imageUrl: null
}));
