
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { INITIAL_STATE, VisualizationState, getSegmentColor, TimelineNode, ViewMode } from './types';
import { INITIAL_NODES, THEME_MAP } from './constants';
import SpiralVisualization from './components/SpiralVisualization';
import Controls from './components/Controls';
import Timeline from './components/Timeline';
import ImageInput from './components/ImageInput';
import ControlPanel from './components/ControlPanel';
import MoodPicker from './components/MoodPicker';
import ImmersiveViewer from './components/ImmersiveViewer';
import { RefreshCw, ChevronLeft, Edit3, Eye, ArrowLeft, Beaker } from 'lucide-react';

const App: React.FC = () => {
  // Spiral State
  const [spiralState, setSpiralState] = useState<VisualizationState>(INITIAL_STATE);
  
  // Memory Lab State
  const [nodes, setNodes] = useState<TimelineNode[]>(INITIAL_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [mode, setMode] = useState<ViewMode>(ViewMode.EDIT);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Filter and Redistribute nodes based on state count
  // We slice the data but recalculate longitude for "average distribution" (平均分布)
  const visibleNodes = useMemo(() => {
    const count = spiralState.nodeCount;
    return nodes.slice(0, count).map((node, index) => ({
      ...node,
      // Calculate even spacing: e.g., if 3 nodes, angles are 0, 120, 240
      longitude: (index / count) * 360
    }));
  }, [nodes, spiralState.nodeCount]);

  // Reset selection if the selected node is no longer visible
  useEffect(() => {
    if (selectedNodeId !== null && selectedNodeId >= spiralState.nodeCount) {
      setSelectedNodeId(null);
    }
  }, [spiralState.nodeCount, selectedNodeId]);

  // Reset focus when switching to EDIT mode
  useEffect(() => {
    if (mode === ViewMode.EDIT) {
      setIsFocused(false);
    }
  }, [mode]);

  const selectedNode = useMemo(() => 
    visibleNodes.find(n => n.id === selectedNodeId) || null,
    [visibleNodes, selectedNodeId]
  );

  const handleUpdateNode = (id: number, updates: Partial<TimelineNode>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const handleBulkUpload = (images: string[]) => {
    if (!images.length) return;
    
    // Start from the selected node or from the beginning if none selected
    const startIdx = selectedNodeId ?? 0;
    
    setNodes(prev => {
      const newNodes = [...prev];
      images.forEach((img, offset) => {
        const targetIdx = startIdx + offset;
        if (targetIdx < newNodes.length) {
          newNodes[targetIdx] = { ...newNodes[targetIdx], imageUrl: img };
        }
      });
      return newNodes;
    });

    // Auto-increase node count if more images were uploaded than currently visible
    const requiredCount = Math.min(12, startIdx + images.length);
    if (requiredCount > spiralState.nodeCount) {
      setSpiralState(prev => ({ ...prev, nodeCount: requiredCount }));
    }
  };

  const handleSegmentClick = useCallback((id: number) => {
    if (mode === ViewMode.VIEW) {
      setIsFocused(true);
      return;
    }

    const randomHue = Math.floor(Math.random() * 360);
    const vibrantRandomColor = `hsl(${randomHue}, 100%, 60%)`;
    // We use a factor of 4 here because we have 400 segments instead of 100.
    // This scales the visual "brush size" to feel consistent with the 0.25-2.0 range.
    const brushSize = spiralState.segmentBrushSize * 4; 
    
    setSpiralState(prev => ({
      ...prev,
      segments: prev.segments.map(seg => {
        // Simple and precise distance check for high-res segments
        if (Math.abs(seg.id - id) <= brushSize) {
          return { ...seg, color: vibrantRandomColor };
        }
        return seg;
      })
    }));
  }, [mode, spiralState.segmentBrushSize]);

  const syncSegmentsWithHues = (hues: number[]) => {
    setSpiralState(prev => ({
      ...prev,
      segments: prev.segments.map((seg, i) => {
        const periodIdx = Math.floor(i / (prev.segments.length / 5));
        return {
          ...seg,
          color: getSegmentColor(hues[periodIdx], i)
        };
      })
    }));
  };

  const isPanelOpen = mode === ViewMode.EDIT && selectedNodeId !== null;
  const isImmersiveOpen = !!(mode === ViewMode.VIEW && selectedNodeId !== null && selectedNode?.imageUrl);
  const effectiveAutoRotate = autoRotate && !isPanelOpen && !isImmersiveOpen;

  const currentValenceRaw = selectedNode?.valence ?? 0;
  const roundedValence = Math.round(currentValenceRaw);
  const safeValence = Math.max(-3, Math.min(3, roundedValence));

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#F3F3F3] select-none transition-all duration-1000">
      
      {/* 3D Visualization Area */}
      <main className="absolute inset-0 z-0">
        <SpiralVisualization 
          state={spiralState} 
          onSegmentClick={handleSegmentClick}
          nodes={visibleNodes}
          selectedNodeId={selectedNodeId}
          onNodeClick={(id) => setSelectedNodeId(id)}
          autoRotate={effectiveAutoRotate}
          isFocused={isFocused}
        />
      </main>

      {/* Top-Center Logo */}
      <nav className={`fixed top-10 left-1/2 -translate-x-1/2 flex items-center gap-5 z-30 pointer-events-none transition-all duration-700 ${isFocused ? 'opacity-0 -translate-y-10' : 'opacity-100'}`}>
          <div className="w-8 h-5 text-[#8E9AAF] pointer-events-auto">
              <svg viewBox="0 0 32 20" fill="none" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.8" strokeDasharray="2.5 3" opacity="0.6" />
                  <circle cx="17" cy="10" r="8" stroke="currentColor" strokeWidth="2.2" />
              </svg>
          </div>
          <h1 className="text-[11.5px] tracking-[0.55em] uppercase flex items-center transition-all duration-1000">
            <span className="font-medium text-[#566573]">Kizuna</span>
            <span className="font-light text-[#AAB7B8] ml-4">Spiral</span>
          </h1>
      </nav>

      {/* Side Controls (Spiral Params) - Only visible in EDIT mode */}
      {!isFocused && mode === ViewMode.EDIT && (
        <Controls 
          state={spiralState} 
          setState={setSpiralState} 
          onHuesChange={syncSegmentsWithHues} 
        />
      )}

      {/* Exit Focused Mode Button */}
      {isFocused && (
        <button 
          onClick={() => setIsFocused(false)}
          className="fixed top-10 left-10 z-50 flex items-center gap-3 px-6 py-3 bg-white/60 backdrop-blur-2xl border border-white rounded-[24px] text-slate-900 font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all animate-in slide-in-from-left-10 duration-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Spiral
        </button>
      )}

      {/* Timeline Axis */}
      {!isFocused && <Timeline duration={spiralState.duration} />}

      {/* Sidebar for Memory Lab - Updated to floating style */}
      <div className={`
        fixed right-8 top-8 bottom-8 w-80 md:w-96
        bg-white/60 backdrop-blur-2xl border border-white/80 rounded-3xl p-8 shadow-2xl
        pointer-events-auto transition-all duration-500 ease-in-out z-40
        ${isPanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-[calc(100%+40px)] opacity-0'}
        flex flex-col
      `}>
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-800 rounded-xl shadow-lg">
              <Beaker size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight font-space leading-none">Memory Lab</h2>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.3em] mt-1">
                Fragment {selectedNodeId !== null ? selectedNodeId + 1 : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSelectedNodeId(null)}
            className="p-2 hover:bg-white/40 rounded-full transition-colors text-slate-400 hover:text-indigo-500"
          >
            <ChevronLeft className="w-5 h-5 rotate-180" />
          </button>
        </header>

        <div className="flex-grow overflow-y-auto pr-1 space-y-10 custom-scrollbar">
          {selectedNode && (
            <>
              <div className="space-y-4">
                <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">How were you feeling?</h3>
                <MoodPicker 
                  valence={selectedNode.valence}
                  onChange={(v) => handleUpdateNode(selectedNode.id, { valence: v })}
                />
              </div>
              <div className="h-px bg-slate-200/50" />
              <ControlPanel 
                selectedNode={selectedNode}
                onUpdateNode={handleUpdateNode}
              />
              <div className="h-px bg-slate-200/50" />
              <ImageInput 
                currentImage={selectedNode.imageUrl ?? null}
                onImageProcessed={(base64) => handleUpdateNode(selectedNode.id, { imageUrl: base64 })} 
                onBulkImagesProcessed={handleBulkUpload}
              />
            </>
          )}
        </div>

        <div className="pt-6 mt-4 border-t border-slate-200/50">
            <button 
              onClick={() => setSelectedNodeId(null)}
              style={{ backgroundColor: THEME_MAP[safeValence].accentColor }}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm shadow-xl hover:brightness-110 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300"
            >
              Finalize Fragment
            </button>
        </div>
      </div>

      {/* Bottom Mode Switcher */}
      <div className="fixed bottom-8 right-8 z-30 pointer-events-auto flex items-center gap-4">
        <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`p-4 rounded-full bg-white/60 backdrop-blur-xl border border-white shadow-lg text-slate-600 transition-all ${!autoRotate ? 'opacity-50' : 'hover:scale-110'}`}
        >
          <RefreshCw className={`w-5 h-5 ${effectiveAutoRotate ? 'animate-spin-slow' : ''}`} />
        </button>
        <div className="bg-white/60 backdrop-blur-2xl p-1.5 rounded-[26px] border border-white/50 shadow-xl flex items-center gap-1">
          <button 
            onClick={() => { setMode(ViewMode.EDIT); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-[22px] text-sm font-bold transition-all ${mode === ViewMode.EDIT ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
          <button 
            onClick={() => { setMode(ViewMode.VIEW); }}
            className={`flex items-center gap-2 px-6 py-3 rounded-[22px] text-sm font-bold transition-all ${mode === ViewMode.VIEW ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}
          >
            <Eye className="w-4 h-4" />
            View
          </button>
        </div>
      </div>

      {/* Immersive Viewer Overlay */}
      {isImmersiveOpen && selectedNode && (
        <ImmersiveViewer 
          node={selectedNode} 
          onClose={() => setSelectedNodeId(null)} 
        />
      )}

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default App;
