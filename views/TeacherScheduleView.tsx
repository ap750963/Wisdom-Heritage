import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, PlusIcon, CalendarIcon, LoaderIcon, ClockIcon, TrashIcon, PencilIcon, ChevronDownIcon, SchoolIcon, UserIcon } from '../components/Icons';
import { User, ScheduleEntry } from '../types';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from '../components/StudentActionModals';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface TeacherScheduleViewProps {
  currentUser: User | null;
  onBack: () => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const TeacherScheduleView: React.FC<TeacherScheduleViewProps> = ({ currentUser, onBack }) => {
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(DAYS[0]);
  const [viewMode, setViewMode] = useState<'personal' | 'class'>('personal');
  const [editingCell, setEditingCell] = useState<{day: string, timeSlot: string} | null>(null);

  const isClassTeacher = !!(currentUser?.assignedClass && currentUser?.assignedSection);
  const classLabel = `${currentUser?.assignedClass}-${currentUser?.assignedSection}`;

  useEffect(() => { fetchSchedule(); }, [currentUser, viewMode]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      let res;
      if (viewMode === 'personal') {
        if (!currentUser?.employeeId) return;
        res = await sheetApi.getTeacherSchedule(currentUser.employeeId);
      } else {
        res = await sheetApi.getClassSchedule(currentUser?.assignedClass!, currentUser?.assignedSection!);
      }

      if (res.success && res.data) {
        setSchedule(res.data);
        const distinctSlots = Array.from(new Set<string>(res.data.map(item => item.timeSlot))).sort();
        if (distinctSlots.length === 0) setTimeSlots(['08:00 - 09:00', '09:00 - 10:00', '10:00 - 11:00', '11:30 - 12:30', '12:30 - 01:30']);
        else setTimeSlots(distinctSlots);
      }
    } finally { setLoading(false); }
  };

  const getEntry = (day: string, slot: string) => schedule.find(s => s.day === day && s.timeSlot === slot);

  return (
    <div className="flex flex-col h-full bg-[#f2f6fc] dark:bg-black font-sans transition-colors duration-200">
        <div className="bg-indigo-600 px-6 py-6 pb-8 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
            <div className="flex items-center justify-between text-white mb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <h2 className="text-xl font-bold tracking-wide">Schedule</h2>
                </div>
                <button onClick={() => { setEditingCell({ day: activeDay, timeSlot: '' }); }} className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all"><PlusIcon className="w-4 h-4" /><span>Add Slot</span></button>
            </div>

            {isClassTeacher && (
                <div className="flex bg-black/10 p-1 rounded-2xl mb-6 backdrop-blur-sm mx-2">
                    <button 
                        onClick={() => setViewMode('personal')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'personal' ? 'bg-white text-indigo-600 shadow-md' : 'text-white/70 hover:text-white'}`}
                    >
                        My Schedule
                    </button>
                    <button 
                        onClick={() => setViewMode('class')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'class' ? 'bg-white text-indigo-600 shadow-md' : 'text-white/70 hover:text-white'}`}
                    >
                        Class {classLabel}
                    </button>
                </div>
            )}
            
            <div className="grid grid-cols-6 gap-1.5 items-center px-2">
                {DAYS.map(day => (
                    <button 
                        key={day} 
                        onClick={() => setActiveDay(day)} 
                        className={`py-2.5 rounded-xl font-bold transition-all shadow-sm flex flex-col items-center justify-center ${activeDay === day ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    >
                        <span className="text-[10px] sm:text-xs">{day.substring(0, 3)}</span>
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 py-8 relative z-10">
            {loading ? <div className="flex justify-center py-20"><LoaderIcon className="w-10 h-10 animate-spin text-indigo-600" /></div> : (
                <>
                    <div className="hidden sm:block overflow-x-auto pb-4">
                        <div className="min-w-[800px] bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-sm border-none overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-zinc-950/50 font-bold border-none">
                                    <tr><th className="px-6 py-4 w-32">Time</th>{DAYS.map(day => (<th key={day} className={`px-4 py-4 text-center ${activeDay === day ? 'text-indigo-600 bg-indigo-50/30' : ''}`}>{day.substring(0,3)}</th>))}</tr>
                                </thead>
                                <tbody>
                                    {timeSlots.map((slot, idx) => (
                                        <tr key={slot} className={`border-none hover:bg-slate-50/30 transition-colors`}>
                                            <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap bg-slate-50/50 dark:bg-zinc-950/20">{slot}</td>
                                            {DAYS.map(day => { 
                                                const entry = getEntry(day, slot); 
                                                return (
                                                    <td key={day} className={`p-2 border-l border-slate-50 dark:border-zinc-800/50 ${activeDay === day ? 'bg-indigo-50/10' : ''}`}>
                                                        <div onClick={() => setEditingCell({ day, timeSlot: slot })} className={`h-24 rounded-xl p-2 cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-center items-center text-center gap-1 border border-dashed border-transparent hover:border-slate-200 ${entry && entry.subject ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-800 dark:text-indigo-300' : 'hover:bg-slate-50 dark:hover:bg-zinc-800/40 text-slate-300 dark:text-zinc-700'}`}>
                                                            {entry && entry.subject ? (
                                                                <>
                                                                    <span className="font-black text-xs line-clamp-1">{entry.subject}</span>
                                                                    <span className="text-[9px] font-bold opacity-70 bg-white/50 dark:bg-zinc-800/50 px-2 py-0.5 rounded-md truncate max-w-full">
                                                                        {viewMode === 'personal' ? entry.className : entry.teacherName}
                                                                    </span>
                                                                </>
                                                            ) : (<PlusIcon className="w-5 h-5 opacity-50" />)}
                                                        </div>
                                                    </td>
                                                ); 
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div className="sm:hidden space-y-3 pb-32">
                        {timeSlots.map(slot => { 
                            const entry = getEntry(activeDay, slot); 
                            return (
                                <div key={slot} onClick={() => setEditingCell({ day: activeDay, timeSlot: slot })} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm flex items-center gap-4 active:scale-[0.98] transition-all relative group border-none">
                                    <div className="w-16 flex flex-col items-center justify-center border-r border-slate-100 dark:border-zinc-800 pr-4">
                                        <ClockIcon className="w-5 h-5 text-slate-400 mb-1" />
                                        <span className="text-[10px] font-bold text-slate-500 text-center leading-tight">{slot.split('-')[0]}</span>
                                        <span className="text-[10px] font-bold text-slate-400 text-center leading-tight">{slot.split('-')[1]}</span>
                                    </div>
                                    <div className="flex-1">
                                        {entry && entry.subject ? (
                                            <div>
                                                <h4 className="font-bold text-slate-900 dark:text-white text-base">{entry.subject}</h4>
                                                <p className="text-xs font-bold text-indigo-500 mt-0.5">
                                                    {viewMode === 'personal' ? `Class ${entry.className}` : `Faculty: ${entry.teacherName}`}
                                                </p>
                                            </div>
                                        ) : (<p className="text-sm font-bold text-slate-300 italic">Unscheduled Slot</p>)}
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                        {entry && entry.subject ? <PencilIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                                    </div>
                                </div>
                            ); 
                        })}
                        {timeSlots.length === 0 && <div className="text-center py-10 text-slate-400">No time slots defined. Tap "Add Slot" above.</div>}
                    </div>
                </>
            )}
        </div>

        {editingCell && (
            <EditClassModal 
                isOpen={!!editingCell} 
                onClose={() => setEditingCell(null)} 
                day={editingCell.day} 
                timeSlot={editingCell.timeSlot} 
                currentUser={currentUser} 
                viewMode={viewMode}
                initialData={getEntry(editingCell.day, editingCell.timeSlot)} 
                onSuccess={() => { fetchSchedule(); setEditingCell(null); }} 
            />
        )}
    </div>
  );
};

const EditClassModal: React.FC<{ isOpen: boolean; onClose: () => void; day: string; timeSlot: string; currentUser: User | null; viewMode: 'personal' | 'class'; initialData?: ScheduleEntry; onSuccess: () => void }> = ({ isOpen, onClose, day, timeSlot, currentUser, viewMode, initialData, onSuccess }) => {
    const [formData, setFormData] = useState({
        subject: initialData?.subject || '',
        timeSlot: timeSlot || initialData?.timeSlot || '',
        className: initialData?.className || (viewMode === 'class' ? `${currentUser?.assignedClass}-${currentUser?.assignedSection}` : 'Nursery-A'),
        teacherName: initialData?.teacherName || (viewMode === 'personal' ? currentUser?.name || '' : '')
    });
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await sheetApi.saveSchedule(
                viewMode === 'personal' ? currentUser?.employeeId || '' : initialData?.teacherId || '',
                formData.teacherName,
                day,
                formData.timeSlot,
                formData.subject,
                formData.className
            );
            if (res.success) onSuccess();
            else alert(String(res.message || "Failed to save schedule."));
        } catch (e) { alert("A system error occurred."); }
        finally { setLoading(false); }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to clear this slot?")) return;
        setLoading(true);
        try {
            const res = await sheetApi.deleteSchedule(day, formData.timeSlot, formData.className);
            if (res.success) onSuccess();
            else alert(String(res.message || "Failed to clear slot."));
        } catch (e) { alert("Failed to clear slot."); }
        finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Session Details" icon={<ClockIcon className="w-6 h-6" />}>
            <form onSubmit={handleSave} className="space-y-6">
                <div className="p-4 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700 flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <CalendarIcon className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{day}</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input label="Subject Name" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required placeholder="e.g. Mathematics" />
                    <Input label="Time Slot" value={formData.timeSlot} onChange={e => setFormData({ ...formData, timeSlot: e.target.value })} required placeholder="e.g. 09:00 - 10:00" />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Class" value={formData.className} onChange={e => setFormData({ ...formData, className: e.target.value })} required placeholder="e.g. 5-A" disabled={viewMode === 'class'} />
                        <Input label="Teacher" value={formData.teacherName} onChange={e => setFormData({ ...formData, teacherName: e.target.value })} required placeholder="Faculty Name" disabled={viewMode === 'personal'} />
                    </div>
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <Button type="submit" fullWidth isLoading={loading} className="h-14 bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20">Save Schedule</Button>
                    {initialData && (
                        <button type="button" onClick={handleDelete} disabled={loading} className="text-xs font-bold text-red-500 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">Clear this Slot</button>
                    )}
                </div>
            </form>
        </BaseModal>
    );
};