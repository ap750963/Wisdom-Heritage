import React, { ButtonHTMLAttributes } from 'react';
import { LoaderIcon } from './Icons';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false, 
  fullWidth = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-2xl text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
  
  const variants = {
    primary: "bg-[#197fe6] text-white hover:bg-[#166yc9] shadow-lg shadow-blue-500/25 border border-transparent",
    secondary: "bg-white dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 shadow-sm",
    outline: "border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#197fe6] hover:text-[#197fe6] bg-transparent",
    ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
    danger: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-100 dark:border-red-900/50",
  };

  const sizes = "h-12 py-3 px-6"; // Taller, more touch-friendly
  const width = fullWidth ? "w-full" : "";

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes} ${width} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
};