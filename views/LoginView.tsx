import React, { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { UserIcon, LockIcon, WisdomLogo, EyeIcon, EyeOffIcon } from '../components/Icons';
import { sheetApi } from '../services/SheetApi';
import { User } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await sheetApi.login(username, password);
      
      if (response.success && response.data) {
        onLogin(response.data.user);
      } else {
        setError(response.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black p-6 font-sans transition-colors duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-950 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        <div className="p-8 sm:p-10 flex flex-col items-center">
            {/* School Logo */}
            <div className="w-20 h-20 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 shadow-lg border border-slate-100 dark:border-zinc-800 p-2 overflow-hidden">
                <WisdomLogo className="w-full h-full" />
            </div>

            <div className="text-center mb-8 space-y-1">
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-zinc-100 tracking-tighter">Welcome Back</h2>
                <p className="text-slate-500 dark:text-zinc-500 font-medium text-sm">Sign in to access Wisdom Portal</p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-6">
                <div className="space-y-4">
                    <Input
                        id="username"
                        type="text"
                        label="USERNAME"
                        placeholder="Enter Username"
                        icon={<UserIcon className="w-5 h-5" />}
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="h-14 bg-slate-50 dark:bg-zinc-900 border-none text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:zinc-600 focus:bg-white dark:focus:bg-zinc-800 ring-1 ring-slate-200 dark:ring-zinc-800"
                    />
                    <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        label="PASSWORD"
                        placeholder="••••••••"
                        icon={<LockIcon className="w-5 h-5" />}
                        suffix={
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                          >
                            {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                          </button>
                        }
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="h-14 bg-slate-50 dark:bg-zinc-900 border-none text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:zinc-600 focus:bg-white dark:focus:bg-zinc-800 ring-1 ring-slate-200 dark:ring-zinc-800"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <div className="relative flex items-center justify-center">
                            <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-zinc-800 checked:bg-[#197fe6] checked:border-[#197fe6] transition-all" />
                            <div className="absolute opacity-0 peer-checked:opacity-100 pointer-events-none text-white scale-75">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500 dark:text-zinc-500 group-hover:text-slate-700 dark:group-hover:text-zinc-300 transition-colors">Remember me</span>
                    </label>
                    {showContactAdmin ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 animate-in fade-in slide-in-from-right-2">
                        Contact School Admin.
                      </span>
                    ) : (
                      <button 
                        type="button"
                        onClick={() => setShowContactAdmin(true)}
                        className="text-xs font-bold text-[#197fe6] hover:text-[#4facfe] transition-colors"
                      >
                        Forgot Password?
                      </button>
                    )}
                </div>

                {error && (
                    <div className="p-3 rounded-2xl bg-red-500/10 text-red-500 text-[11px] font-bold text-center border border-red-500/20 animate-in shake duration-300">
                        {error}
                    </div>
                )}

                <Button type="submit" fullWidth isLoading={isLoading} className="h-14 text-base font-extrabold tracking-tight shadow-xl shadow-blue-500/20 bg-[#197fe6] hover:bg-[#166yc9] active:scale-[0.98] rounded-2xl">
                    Sign In
                </Button>
            </form>
            
            <div className="mt-10">
                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-700 uppercase tracking-[0.2em]">© 2024 Wisdom Heritage Systems</p>
            </div>
        </div>
      </div>
    </div>
  );
};