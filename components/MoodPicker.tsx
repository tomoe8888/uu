
import React, { useState, useRef, useEffect } from 'react';
import { THEME_MAP, MOOD_LEVELS } from '../constants';

interface MoodPickerProps {
  valence: number;
  onChange: (v: number) => void;
}

const MoodPicker: React.FC<MoodPickerProps> = ({ valence, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  
  // Normalize valence from [-3, 3] to [0, 100] for UI
  const currentPercent = ((valence + 3) / 6) * 100;
  
  const roundedValence = Math.round(valence);
  const safeValence = Math.max(-3, Math.min(3, roundedValence));
  const currentTheme = THEME_MAP[safeValence];
  const currentLevel = MOOD_LEVELS.find(l => l.valence === safeValence);

  const bloomFactor = (valence + 3) / 6; // 0 to 1

  const handlePointerMove = (e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newValence = (percentage * 6) - 3;
    onChange(newValence);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove);
      const stopDragging = () => setIsDragging(false);
      window.addEventListener('pointerup', stopDragging);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', stopDragging);
      };
    }
  }, [isDragging]);

  return (
    <div className="relative rounded-2xl p-4 bg-white/20 border border-white/40 overflow-hidden transition-all duration-1000">
      {/* Background Glow */}
      <div 
        className="absolute inset-0 opacity-10 blur-[60px] transition-all duration-1000 pointer-events-none"
        style={{ backgroundColor: currentTheme.blobColor }}
      />

      {/* Label Display */}
      <div className="relative z-10 text-center mb-4 h-8 flex items-center justify-center">
        <h2 className="text-sm font-bold text-slate-700 transition-all duration-700 uppercase tracking-wide">
          {currentLevel?.label}
        </h2>
      </div>

      {/* Top-down Flower Visualization */}
      <div className="relative h-32 flex items-center justify-center mb-6">
        <div className="relative w-28 h-28">
          {[...Array(7)].map((_, i) => {
            const rotationOffset = (i * 360) / 7;
            const delay = i * 0.15;
            const opacity = 0.4 - (i * 0.05);
            const borderRadius = mixBorderRadius(bloomFactor);
            
            return (
              <div 
                key={i}
                className="absolute inset-0 transition-all duration-1000 ease-out flex items-center justify-center"
                style={{
                  transform: `rotate(${rotationOffset + valence * 10}deg) scale(${0.7 + bloomFactor * 0.3 - i * 0.08})`,
                }}
              >
                <div 
                  className="w-full h-full transition-all duration-1000"
                  style={{
                    backgroundColor: currentTheme.blobColor,
                    opacity: opacity,
                    borderRadius: borderRadius,
                    filter: `blur(${4 + i * 2}px)`,
                    mixBlendMode: 'multiply',
                    animation: `flowerPulse ${6 + i}s ease-in-out infinite alternate`,
                    animationDelay: `${delay}s`
                  }}
                />
              </div>
            );
          })}
          {/* Inner Core Stamen */}
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/80 shadow-lg z-20 backdrop-blur-sm transition-all duration-1000"
            style={{ transform: `translate(-50%, -50%) scale(${0.8 + bloomFactor * 0.4})` }}
          />
        </div>
      </div>

      {/* Slider */}
      <div className="px-1 relative z-20">
        <div 
          ref={trackRef}
          className="relative h-10 flex items-center cursor-pointer touch-none"
          onPointerDown={(e) => {
            setIsDragging(true);
            const rect = trackRef.current!.getBoundingClientRect();
            const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
            const percentage = x / rect.width;
            onChange((percentage * 6) - 3);
          }}
        >
          <div className="absolute inset-x-0 h-2 bg-slate-300/30 rounded-full border border-white/50 shadow-inner overflow-hidden">
            <div 
              className="h-full transition-all duration-300 opacity-40"
              style={{ width: `${currentPercent}%`, backgroundColor: currentTheme.blobColor }}
            />
          </div>
          
          {/* Knob */}
          <div 
            className={`absolute w-8 h-8 bg-white rounded-full shadow-lg border border-slate-100 flex items-center justify-center z-40 ${isDragging ? 'scale-110' : 'hover:scale-105 transition-transform'}`}
            style={{ 
              left: `calc(${currentPercent}% - 16px)`,
              transition: isDragging ? 'none' : 'left 0.3s cubic-bezier(0.23, 1, 0.32, 1)'
            }}
          >
            <div 
              className="w-6 h-6 rounded-full shadow-inner transition-colors duration-700" 
              style={{ backgroundColor: currentTheme.blobColor }} 
            />
          </div>
        </div>

        <div className="flex justify-between mt-2 px-0.5 opacity-40">
          <span className="text-[7px] font-bold uppercase tracking-widest text-slate-500">不快</span>
          <span className="text-[7px] font-bold uppercase tracking-widest text-slate-500">快適</span>
        </div>
      </div>

      <style>{`
        @keyframes flowerPulse {
          0% { opacity: 0.2; transform: scale(0.95); }
          100% { opacity: 0.4; transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// Helper to transition border radius for petal shapes
function mixBorderRadius(factor: number) {
  if (factor < 0.3) return "30% 70% 30% 70% / 30% 70% 30% 70%"; 
  if (factor < 0.7) return "45% 55% 70% 30% / 45% 50% 60% 50%";
  return "50% 50% 50% 50%"; 
}

export default MoodPicker;
