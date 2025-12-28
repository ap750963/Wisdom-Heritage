
import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from './Icons';

type DateNavigatorVariant = 'emerald' | 'amber' | 'indigo' | 'rose' | 'slate' | 'purple' | 'blue';

interface DateNavigatorProps {
  value: string; // YYYY-MM-DD
  onChange: (newValue: string) => void;
  className?: string;
  variant?: DateNavigatorVariant;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ 
  value, 
  onChange, 
  className = '',
  variant = 'emerald'
}) => {
  const date = new Date(value);
  
  const handleMove = (days: number) => {
    const next = new Date(date);
    next.setDate(date.getDate() + days);
    onChange(next.toISOString().split('T')[0]);
  };

  const formattedDate = date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
  });

  const variants: Record<DateNavigatorVariant, string> = {
    emerald: 'bg-emerald-600 shadow-emerald-900/20',
    amber: 'bg-amber-500 shadow-amber-900/20',
    indigo: 'bg-indigo-600 shadow-indigo-900/20',
    rose: 'bg-rose-500 shadow-rose-900/20',
    slate: 'bg-slate-700 shadow-slate-900/20',
    purple: 'bg-purple-600 shadow-purple-900/20',
    blue: 'bg-blue-600 shadow-blue-900/20'
  };

  return (
    <div className={`${variants[variant]} text-white rounded-[1.5rem] p-1.5 px-4 flex items-center justify-between shadow-lg relative transition-all duration-300 min-h-[50px] ${className}`}>
      <button 
        type="button"
        onClick={() => handleMove(-1)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all z-10 shrink-0"
      >
        <ChevronLeftIcon className="w-5 h-5" />
      </button>

      <div className="flex-1 flex flex-col items-center select-none relative px-2 py-0.5 rounded-xl group transition-colors hover:bg-white/10 mx-2 overflow-hidden">
        <input 
          type="date"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ colorScheme: 'dark' }}
        />
        
        <div className="flex items-center gap-1 text-[7px] font-black uppercase tracking-[0.15em] opacity-80 mb-0 group-hover:opacity-100 transition-opacity relative z-10">
          <CalendarIcon className="w-3-3" />
          <span>Select Date</span>
        </div>
        <div className="text-sm font-bold tracking-tight group-hover:scale-105 transition-transform relative z-10 leading-none pb-0.5">
          {formattedDate}
        </div>
      </div>

      <button 
        type="button"
        onClick={() => handleMove(1)}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 transition-all z-10 shrink-0"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
