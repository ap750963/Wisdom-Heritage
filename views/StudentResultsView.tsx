import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  LoaderIcon, 
  ScrollTextIcon,
  AwardIcon,
  ChevronRightIcon
} from '../components/Icons';
import { User, ExamResult } from '../types';
import { sheetApi } from '../services/SheetApi';

interface StudentResultsViewProps {
  currentUser: User;
  onBack: () => void;
}

export const StudentResultsView: React.FC<StudentResultsViewProps> = ({ currentUser, onBack }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const id = currentUser.admissionNo || currentUser.username;
    sheetApi.getStudentResults(id).then(res => {
      if (res.success && res.data) {
          setResults([...res.data].reverse());
      }
      setLoading(false);
    });
  }, [currentUser]);

  const selectedExam = selectedIndex !== null ? results[selectedIndex] : null;

  return (
    <div className="flex flex-col h-full bg-[#f2f6fc] dark:bg-black font-sans transition-colors duration-200">
      <div className="bg-rose-500 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-4 text-white">
              <button onClick={selectedIndex !== null ? () => setSelectedIndex(null) : onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95">
                  <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold tracking-wide">{selectedExam ? 'Result Details' : 'Report Card'}</h2>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 relative z-10">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <LoaderIcon className="w-10 h-10 animate-spin text-rose-500 mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching Report Card...</p>
            </div>
        ) : selectedExam ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 pb-32">
                <div className="grid grid-cols-2 gap-4">
                     {(() => {
                         const totalObtained = selectedExam.subjects.reduce((sum, s) => sum + s.marks, 0);
                         const totalMax = selectedExam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
                         const pct = totalMax > 0 ? Math.round((totalObtained/totalMax)*100) : 0;
                         return (
                             <>
                                <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-zinc-800 p-5 rounded-3xl text-center">
                                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Percentage</p>
                                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{pct}%</p>
                                </div>
                                <div className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-zinc-800 p-5 rounded-3xl text-center">
                                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Total Score</p>
                                    <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{totalObtained}/{totalMax}</p>
                                </div>
                             </>
                         );
                     })()}
                </div>
                
                <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Subject Breakdown</h4>
                    {selectedExam.subjects.map((sub, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center p-5 bg-white dark:bg-zinc-900 rounded-[1.5rem] border border-slate-100 dark:border-zinc-800 shadow-sm">
                        <div className="min-w-0 flex-1 pr-4">
                            <span className="text-sm font-bold text-slate-900 dark:text-white block mb-2 truncate">{sub.subject}</span>
                            <div className="h-1.5 w-full bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{ width: `${(sub.marks/sub.maxMarks)*100}%` }}></div>
                            </div>
                        </div>
                        <div className="shrink-0 text-right">
                             <span className="text-lg font-black text-slate-900 dark:text-white">{sub.marks}</span>
                             <span className="text-[10px] text-slate-400 font-bold ml-1">/ {sub.maxMarks}</span>
                        </div>
                      </div>
                    ))}
                </div>

                <button onClick={() => window.print()} className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
                    <ScrollTextIcon className="w-5 h-5" />
                    Download Digital Copy
                </button>
            </div>
        ) : results.length > 0 ? (
            <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300 pb-32">
                <div className="px-2 mb-2">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Select Examination</p>
                </div>
                
                <div className="space-y-3">
                    {results.map((exam, idx) => {
                        const totalObtained = exam.subjects.reduce((sum, s) => sum + s.marks, 0);
                        const totalMax = exam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
                        const pct = totalMax > 0 ? Math.round((totalObtained/totalMax)*100) : 0;

                        return (
                          <button 
                            key={idx} 
                            onClick={() => setSelectedIndex(idx)}
                            className="w-full bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-[2rem] p-6 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group transition-all active:scale-[0.98]"
                          >
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                    <AwardIcon className="w-7 h-7" />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-none mb-1.5">{exam.examName}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Performance Details</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className={`text-xl font-black leading-none ${pct >= 40 ? 'text-emerald-500' : 'text-rose-500'}`}>{pct}%</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{totalObtained}/{totalMax}</p>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-rose-500 transition-colors" />
                            </div>
                          </button>
                        );
                    })}
                </div>
            </div>
        ) : (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-none shadow-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-slate-200 dark:text-zinc-700">
                    <AwardIcon className="w-8 h-8" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">No records found</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Examination results haven't been posted yet.</p>
            </div>
        )}
      </div>
    </div>
  );
};