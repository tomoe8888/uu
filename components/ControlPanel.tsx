
import React from 'react';
import { TimelineNode } from '../types';
import { Type, FileText, Move } from 'lucide-react';

interface ControlPanelProps {
  onUpdateNode: (id: number, updates: Partial<TimelineNode>) => void;
  selectedNode: TimelineNode;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ onUpdateNode, selectedNode }) => {
  return (
    <div className="flex flex-col gap-8">
       <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-widest px-1">
              <Type className="w-3.5 h-3.5 opacity-60" />
              Memory Title
            </div>
            <input 
              type="text"
              value={selectedNode.title}
              onChange={(e) => onUpdateNode(selectedNode.id, { title: e.target.value })}
              className="w-full bg-white/40 border border-white/60 rounded-2xl px-5 py-3.5 text-slate-800 text-sm font-semibold outline-none focus:bg-white/80 transition-all placeholder:text-slate-300 shadow-sm"
              placeholder="Moment name..."
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-widest px-1">
              <FileText className="w-3.5 h-3.5 opacity-60" />
              Reflection
            </div>
            <textarea 
              value={selectedNode.note}
              onChange={(e) => onUpdateNode(selectedNode.id, { note: e.target.value })}
              className="w-full bg-white/40 border border-white/60 rounded-2xl px-5 py-3.5 text-slate-700 text-xs outline-none focus:bg-white/80 h-24 resize-none transition-all placeholder:text-slate-300 leading-relaxed shadow-sm"
              placeholder="A few words about this fragment..."
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                <Move className="w-3.5 h-3.5 opacity-60" />
                Orbital Alignment
              </div>
              <span className="text-[10px] font-mono font-bold text-slate-400">{Math.round(selectedNode.longitude)}°</span>
            </div>
            <input 
              type="range"
              min={0}
              max={360}
              value={selectedNode.longitude}
              onChange={(e) => onUpdateNode(selectedNode.id, { longitude: parseInt(e.target.value) })}
              className="w-full h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-slate-800"
            />
          </div>
       </div>
    </div>
  );
};

export default ControlPanel;
