
import React, { useState } from 'react';
import { Settings2, Clock, Activity, Palette, Info, ChevronLeft, ChevronRight, Hash, Eye, EyeOff, Layers, Wand2, Dices } from 'lucide-react';
import { VisualizationState, getSegmentColor } from '../types';

interface ControlsProps {
  state: VisualizationState;
  setState: React.Dispatch<React.SetStateAction<VisualizationState>>;
  onHuesChange: (hues: number[]) => void;
}

const Controls: React.FC<ControlsProps> = ({ state, setState, onHuesChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleFrequencyChange = (index: number, val: number) => {
    setState(prev => {
      const newFreqs = [...prev.frequencies];
      newFreqs[index] = val;
      return { ...prev, frequencies: newFreqs };
    });
  };

  const handleHueChange = (index: number, hue: number) => {
    setState(prev => {
      const newHues = [...prev.periodHues];
      newHues[index] = hue;
      
      const newState = { ...prev, periodHues: newHues };
      
      const updatedSegments = prev.segments.map((seg, i) => {
        const pIdx = Math.floor(i / (prev.segments.length / 5));
        if (pIdx === index) {
          return { ...seg, color: getSegmentColor(hue, i) };
        }
        return seg;
      });
      
      return { ...newState, segments: updatedSegments };
    });
  };

  const handleRandomize = () => {
    const newFreqs = Array.from({ length: 5 }, () => Math.floor(Math.random() * 199) + 1);
    const newHues = Array.from({ length: 5 }, () => Math.floor(Math.random() * 360));
    
    setState(prev => {
      const updatedSegments = prev.segments.map((seg, i) => {
        const pIdx = Math.floor(i / (prev.segments.length / 5));
        return { ...seg, color: getSegmentColor(newHues[pIdx], i) };
      });
      
      return {
        ...prev,
        frequencies: newFreqs,
        periodHues: newHues,
        segments: updatedSegments
      };
    });
  };

  const handleDurationChange = (val: number) => {
    setState(prev => ({ ...prev, duration: val }));
  };

  const handleNodeCountChange = (val: number) => {
    setState(prev => ({ ...prev, nodeCount: val }));
  };

  const handleBrushSizeChange = (val: number) => {
    setState(prev => ({ ...prev, segmentBrushSize: val }));
  };

  const toggleContainer = () => {
    setState(prev => ({ ...prev, showContainer: !prev.showContainer }));
  };

  const getSegmentRange = (index: number) => {
    const startMonthsTotal = 2026 * 12 + 0;
    const totalMonths = state.duration * 12;
    const segmentWidth = totalMonths / 5;

    const nodeA = startMonthsTotal - (index * segmentWidth);
    const nodeB = startMonthsTotal - ((index + 1) * segmentWidth);

    const formatDate = (m: number) => {
      const year = Math.floor(m / 12);
      const month = (Math.floor(Math.max(0, m)) % 12) + 1;
      return `${year}/${month}`;
    };

    return `${formatDate(nodeA)} - ${formatDate(nodeB)}`;
  };

  return (
    <>
      <div 
        className={`fixed left-8 top-8 bottom-8 w-80 bg-white/60 backdrop-blur-2xl border border-white/80 rounded-3xl p-8 shadow-2xl flex flex-col overflow-y-auto space-y-8 z-20 scrollbar-hide transition-all duration-500 ease-in-out ${
          isCollapsed ? '-translate-x-[calc(100%+40px)] opacity-0' : 'translate-x-0 opacity-100'
        }`}
      >
        <header className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-xl shadow-lg shadow-slate-200">
              <Settings2 size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight font-space">Params</h1>
          </div>
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-2 hover:bg-white/40 rounded-full transition-colors text-slate-400 hover:text-indigo-500"
          >
            <ChevronLeft size={20} />
          </button>
        </header>

        {/* Visibility Toggle */}
        <section className="space-y-4">
           <button 
             onClick={toggleContainer}
             className={`w-full py-3 px-4 rounded-2xl flex items-center justify-between transition-all duration-300 border ${
               state.showContainer 
               ? 'bg-indigo-50 border-indigo-100 text-indigo-600' 
               : 'bg-slate-50 border-slate-100 text-slate-400'
             }`}
           >
             <div className="flex items-center space-x-3">
               {state.showContainer ? <Eye size={18} /> : <EyeOff size={18} />}
               <span className="text-sm font-semibold">Glass Container</span>
             </div>
             <div className={`w-8 h-4 rounded-full relative transition-colors ${state.showContainer ? 'bg-indigo-500' : 'bg-slate-300'}`}>
               <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-300 shadow-sm ${state.showContainer ? 'translate-x-4' : 'translate-x-0'}`} />
             </div>
           </button>
        </section>

        {/* Interaction Brush Size */}
        <section className="space-y-6">
          <div className="space-y-4 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-200 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-bold text-indigo-700 space-x-2">
                <Wand2 size={16} />
                <span>Fragment Length</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-indigo-500">{state.segmentBrushSize.toFixed(2)} units</span>
            </div>
            <p className="text-[9px] text-indigo-400 leading-tight">Fine-tuned control for short emotional fragments.</p>
            <input 
              type="range" 
              min="0.25" 
              max="2.0" 
              step="0.25"
              value={state.segmentBrushSize}
              onChange={(e) => handleBrushSizeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-indigo-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        </section>

        {/* Global Configuration */}
        <section className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-semibold text-slate-600 space-x-2">
                <Clock size={16} />
                <span>Duration (Years)</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-slate-400">{state.duration.toFixed(1)}Y</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="10" 
              step="0.1"
              value={state.duration}
              onChange={(e) => handleDurationChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center text-sm font-semibold text-slate-600 space-x-2">
                <Layers size={16} />
                <span>Memory Spheres</span>
              </label>
              <span className="text-[10px] font-mono font-bold text-slate-400">{state.nodeCount} / 12</span>
            </div>
            <input 
              type="range" 
              min="1" 
              max="12" 
              step="1"
              value={state.nodeCount}
              onChange={(e) => handleNodeCountChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
            />
            <div className="flex justify-between px-1 opacity-40">
              <span className="text-[8px] font-bold text-slate-500">MIN (1)</span>
              <span className="text-[8px] font-bold text-slate-500">MAX (12)</span>
            </div>
          </div>
        </section>

        {/* Temporal Segments */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-600">
              <Activity size={16} />
              <span>Timeline Segments</span>
            </div>
            <button 
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold shadow-md hover:bg-indigo-700 active:scale-95 transition-all group"
            >
              <Dices size={12} className="group-hover:rotate-12 transition-transform" />
              Random
            </button>
          </div>
          
          <div className="space-y-6">
            {state.frequencies.map((freq, idx) => (
              <div key={idx} className="space-y-4 p-4 rounded-2xl bg-white/40 border border-white/60 shadow-sm transition-all hover:bg-white/60">
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mb-1">
                  <span className="uppercase tracking-widest font-bold opacity-80">{getSegmentRange(idx)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-bold border border-slate-200">
                      1/{Math.round(freq)}d
                    </span>
                    <div 
                      className="w-3 h-3 rounded-full border border-white shadow-sm" 
                      style={{ backgroundColor: `hsl(${state.periodHues[idx]}, 70%, 60%)` }}
                    />
                  </div>
                </div>

                {/* Frequency Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] uppercase tracking-tighter text-slate-400 font-bold">
                    <span>Density</span>
                    <span>{freq} Days</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="200" 
                    step="1"
                    value={freq}
                    onChange={(e) => handleFrequencyChange(idx, Math.round(Number(e.target.value)))}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Color/Hue Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[9px] uppercase tracking-tighter text-slate-400 font-bold">
                    <span>Emotion</span>
                    <span>Hue {state.periodHues[idx]}°</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    step="1"
                    value={state.periodHues[idx]}
                    onChange={(e) => handleHueChange(idx, Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer hue-slider"
                    style={{
                      background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-auto pt-6 border-t border-slate-200">
          <div className="flex items-center space-x-2 text-slate-400 text-[10px] font-mono tracking-tight">
            <Info size={12} />
            <span>KIZUNA CORE v2.7.0</span>
          </div>
        </footer>
      </div>

      <button
        onClick={() => setIsCollapsed(false)}
        className={`fixed left-0 top-1/2 -translate-y-1/2 h-40 w-10 bg-white/60 backdrop-blur-xl border-y border-r border-white/80 rounded-r-2xl shadow-xl flex flex-col items-center justify-center space-y-4 group z-20 transition-all duration-500 ease-in-out hover:w-12 hover:bg-white/80 ${
          isCollapsed ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <span className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-space font-bold tracking-[0.3em] text-slate-400 group-hover:text-indigo-500 transition-colors uppercase">
          Parameters
        </span>
        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
      </button>

      <style>{`
        .hue-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          background: white;
          border: 2px solid rgba(0,0,0,0.1);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .hue-slider::-moz-range-thumb {
          width: 12px;
          height: 12px;
          background: white;
          border: 2px solid rgba(0,0,0,0.1);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>
    </>
  );
};

export default Controls;
