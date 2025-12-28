import React, { useState } from 'react';
import { ArrowLeftIcon, ShieldCheckIcon, CalendarIcon, SchoolIcon, GraduationCapIcon } from '../components/Icons';
import { User } from '../types';
import { AcademicYearModal } from '../components/AcademicYearModal';

interface SettingsViewProps {
  onBack: () => void;
  currentUser: User | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack, currentUser }) => {
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6fc] dark:bg-black relative transition-colors duration-200">
      <div className="bg-[#197fe6] px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-4 text-white">
              <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
              <h2 className="text-xl font-bold tracking-wide">Settings</h2>
          </div>
      </div>

      <div className="px-6 pb-32 flex flex-col gap-8 max-w-4xl mx-auto w-full mt-8 relative z-10">
         <section className="space-y-4 pt-4">
             <div className="flex items-center gap-2 px-2">
                 <CalendarIcon className="w-5 h-5 text-[#197fe6]" />
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic Lifecycle</h3>
             </div>
             <div className="bg-white dark:bg-[#0f172a] rounded-[2.5rem] p-8 shadow-soft border border-slate-100 dark:border-white/5">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0"><GraduationCapIcon className="w-12 h-12 text-[#197fe6]" /></div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <h4 className="text-xl font-bold text-slate-900 dark:text-white">Start New Academic Session</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Initialize the system for the next academic year. This process will backup all databases and clear current year transactional records.</p>
                    </div>
                    <button onClick={() => setIsTransitionModalOpen(true)} className="w-full md:w-auto px-8 h-14 bg-[#197fe6] text-white rounded-2xl font-bold hover:bg-[#166yc9] transition-all shadow-lg active:scale-95">Begin Transition</button>
                </div>
             </div>
         </section>
         <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800"><div className="flex items-start gap-4"><div className="w-10 h-10 rounded-full bg-white dark:bg-[#0f172a] flex items-center justify-center text-emerald-500 shadow-sm shrink-0"><ShieldCheckIcon className="w-5 h-5" /></div><div className="space-y-1"><p className="text-sm font-bold text-slate-800 dark:text-white">Database & Security</p><p className="text-xs text-slate-500 leading-relaxed">All school data is stored securely in your private Google Workspace. System logs track all administrative changes.</p></div></div></div>
      </div>
      <AcademicYearModal isOpen={isTransitionModalOpen} onClose={() => setIsTransitionModalOpen(false)} currentUser={currentUser} />
    </div>
  );
};