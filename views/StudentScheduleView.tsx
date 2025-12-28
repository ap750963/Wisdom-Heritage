import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftIcon, 
  LoaderIcon, 
  ClockIcon,
  CalendarIcon
} from '../components/Icons';
import { User, ScheduleEntry } from '../types';
import { sheetApi } from '../services/SheetApi';

interface StudentScheduleViewProps {
  currentUser: User;
  onBack: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StudentScheduleView: React.FC<StudentScheduleViewProps> = ({ currentUser, onBack }) => {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(DAYS[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1]);

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!currentUser.assignedClass || !currentUser.assignedSection) return;
      setLoading(true);
      try {
        const res = await sheetApi.getClassSchedule(currentUser.assignedClass, currentUser.assignedSection);
        if (res.success && res.data) {
          setSchedule(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [currentUser]);

  const timeSlots = useMemo(() => {
    return Array.from(new Set(schedule.map(item => item.timeSlot))).sort();
  }, [schedule]);

  const getEntry = (day: string, slot: string) => schedule.find(s => s.day === day && s.timeSlot === slot);

  const daySchedule = useMemo(() => {
    return schedule
      .filter(s => s.day === activeDay)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  }, [schedule, activeDay]);

  return (
    <div className="flex flex-col h-full bg-[#f2f6fc] dark:bg-black font-sans transition-colors duration-200">
      <div className="bg-indigo-600 px-6 py-6 pb-8 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-4 text-white mb-6">
              <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95">
                  <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold tracking-wide">Class Timetable</h2>
          </div>

          <div className="grid grid-cols-6 gap-1.5 items-center">
              {DAYS.map(day => (
                  <button 
                    key={day} 
                    onClick={() => setActiveDay(day)} 
                    className={`py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center ${activeDay === day ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                  >
                      <span className="text-[10px] sm:text-xs">{day.substring(0, 3)}</span>
                  </button>
              ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 relative z-10">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <LoaderIcon className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Schedule...</p>
            </div>
        ) : (
            <>
                <div className="hidden md:block overflow-x-auto pb-4">
                    <div className="min-w-[800px] bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border-none overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-zinc-950/50 font-black tracking-widest border-none">
                                <tr>
                                    <th className="px-6 py-5 w-32">Time Slot</th>
                                    {DAYS.map(day => (<th key={day} className={`px-4 py-5 text-center ${activeDay === day ? 'text-indigo-600' : ''}`}>{day.substring(0,3)}</th>))}
                                </tr>
                            </thead>
                            <tbody>
                                {timeSlots.length > 0 ? timeSlots.map((slot) => (
                                    <tr key={slot} className="border-t border-slate-50 dark:border-zinc-800/50 hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap bg-slate-50/50 dark:bg-zinc-950/20">{slot}</td>
                                        {DAYS.map(day => { 
                                            const entry = getEntry(day, slot); 
                                            return (
                                                <td key={day} className={`p-2 border-l border-slate-50 dark:border-zinc-800/50 ${activeDay === day ? 'bg-indigo-50/10' : ''}`}>
                                                    <div className={`min-h-[70px] rounded-2xl p-3 flex flex-col justify-center items-center text-center gap-1 transition-all ${entry ? 'bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-zinc-800' : 'opacity-20 grayscale'}`}>
                                                        {entry ? (
                                                            <>
                                                                <span className="font-black text-[11px] text-indigo-900 dark:text-indigo-100 leading-tight">{entry.subject}</span>
                                                                <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 mt-0.5 opacity-80">{entry.teacherName || 'Faculty'}</span>
                                                            </>
                                                        ) : <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-zinc-700" />}
                                                    </div>
                                                </td>
                                            ); 
                                        })}
                                    </tr>
                                )) : (
                                    <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs italic">No periods scheduled yet</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="md:hidden space-y-4 pb-32">
                    {daySchedule.length > 0 ? daySchedule.map((entry) => (
                        <div key={entry.id} className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] shadow-sm flex items-center gap-5 border-none animate-in slide-in-from-bottom-2">
                            <div className="w-16 flex flex-col items-center justify-center border-r border-slate-100 dark:border-zinc-800 pr-5 shrink-0">
                                <ClockIcon className="w-5 h-5 text-indigo-500 mb-1.5" />
                                <span className="text-[10px] font-black text-slate-900 dark:text-white text-center leading-none mb-1">{entry.timeSlot.split('-')[0]}</span>
                                <span className="text-[9px] font-bold text-slate-400 text-center leading-none">{entry.timeSlot.split('-')[1]}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight mb-1">{entry.subject}</h4>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{entry.teacherName || 'Assigned Faculty'}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-none shadow-sm flex flex-col items-center">
                            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-slate-200 dark:text-zinc-700">
                                <CalendarIcon className="w-8 h-8" />
                            </div>
                            <h3 className="text-slate-900 dark:text-white font-bold text-lg">No classes today</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold text-[10px]">Rest Day or Holiday</p>
                        </div>
                    )}
                </div>
            </>
        )}
      </div>
    </div>
  );
};