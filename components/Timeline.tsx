
import React from 'react';

interface TimelineProps {
  duration: number;
}

const Timeline: React.FC<TimelineProps> = ({ duration }) => {
  const startMonthsTotal = 2026 * 12 + 0; // Jan 2026
  const totalMonths = duration * 12;
  const segmentWidth = totalMonths / 5;

  const nodes = Array.from({ length: 6 }, (_, i) => {
    const months = startMonthsTotal - (i * segmentWidth);
    const year = Math.floor(months / 12);
    const month = (Math.floor(months) % 12) + 1;
    return `${year}/${month}`;
  });

  return (
    <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-end justify-between h-[60%] pointer-events-none z-10">
      <div className="absolute top-0 right-1 w-px bg-slate-300 h-full"></div>
      {nodes.map((date, i) => (
        <div key={i} className="relative flex items-center group">
          <span className="text-[10px] font-mono text-slate-400 mr-4 tracking-widest">{date}</span>
          <div className={`w-6 h-px ${i === 0 ? 'bg-indigo-400 w-10' : 'bg-slate-400'}`}></div>
          <div className={`absolute -right-1 w-2 h-2 rounded-full border border-white ${i === 0 ? 'bg-indigo-500 scale-125' : 'bg-slate-300'}`}></div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
