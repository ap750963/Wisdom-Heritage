import React, { InputHTMLAttributes, forwardRef, useRef, useImperativeHandle } from 'react';
import { CalendarIcon } from './Icons';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type, label, error, icon, suffix, ...props }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Merge the passed ref with our internal ref
    useImperativeHandle(ref, () => inputRef.current!);

    const handleIconClick = () => {
      if (!inputRef.current) return;
      
      // Try to show picker for date/time/color inputs
      if ('showPicker' in HTMLInputElement.prototype && 
          (type === 'date' || type === 'time' || type === 'datetime-local' || type === 'month')) {
        try {
          inputRef.current.showPicker();
        } catch (e) {
          inputRef.current.focus();
        }
      } else {
        inputRef.current.focus();
      }
    };

    const isDateType = type === 'date' || type === 'month' || type === 'datetime-local';
    const finalSuffix = suffix || (isDateType ? <CalendarIcon className="w-4 h-4 opacity-60" /> : null);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-zinc-600 ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div 
              onClick={handleIconClick}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#197fe6] transition-colors flex items-center justify-center [&>svg]:w-full [&>svg]:h-full cursor-pointer z-10"
            >
              {icon}
            </div>
          )}
          <input
            ref={inputRef}
            type={type}
            className={`flex h-12 w-full rounded-2xl border-none bg-slate-100 dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#197fe6]/20 focus:bg-white dark:focus:bg-zinc-800 transition-all duration-200 shadow-inner ${icon ? 'pl-11' : ''} ${finalSuffix ? 'pr-11' : ''} ${error ? 'ring-2 ring-red-500/20 bg-red-50 dark:bg-red-900/10' : ''} ${className}`}
            {...props}
          />
          {finalSuffix && (
            <div 
              onClick={handleIconClick}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#197fe6] hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer flex items-center justify-center z-10 transition-colors"
            >
              {finalSuffix}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-red-500 font-medium ml-1">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";