import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  LoaderIcon, 
  PencilIcon,
  ScrollTextIcon
} from '../components/Icons';
import { User, Homework } from '../types';
import { sheetApi } from '../services/SheetApi';
import { DateNavigator } from '../components/DateNavigator';

interface StudentHomeworkViewProps {
  currentUser: User;
  onBack: () => void;
}

export const StudentHomeworkView: React.FC<StudentHomeworkViewProps> = ({ currentUser, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (currentUser.assignedClass && currentUser.assignedSection) {
      loadHomework();
    }
  }, [selectedDate, currentUser]);

  const loadHomework = async () => {
    setLoading(true);
    try {
      const res = await sheetApi.getHomework(currentUser.assignedClass!, currentUser.assignedSection!, selectedDate);
      if (res.success && res.data) {
        setHomeworkList(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f2f6fc] dark:bg-black font-sans transition-colors duration-200">
      <div className="bg-amber-500 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0">
          <div className="flex items-center gap-4 text-white mb-6">
              <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95">
                  <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold tracking-wide">Daily Homework</h2>
          </div>

          <DateNavigator value={selectedDate} onChange={setSelectedDate} variant="amber" className="h-[50px]" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 space-y-4 relative z-10">
        {loading ? (
            <div className="flex justify-center py-20"><LoaderIcon className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : homeworkList.length > 0 ? (
            <div className="space-y-4 pb-32">
                {homeworkList.map((hw, idx) => (
                    <div key={hw.id || idx} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl shadow-sm border-none space-y-3 animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center">
                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-100 dark:border-zinc-800">
                                {hw.subject}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">{hw.teacherName || 'Faculty'}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                            {hw.content}
                        </p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-none shadow-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-slate-200 dark:text-zinc-700">
                    <ScrollTextIcon className="w-8 h-8" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">No work assigned</h3>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Enjoy your day! No homework for this date.</p>
            </div>
        )}
      </div>
    </div>
  );
};