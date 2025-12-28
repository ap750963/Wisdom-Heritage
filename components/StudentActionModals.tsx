import React, { useState, useEffect } from 'react';
import { Student, FeeSummary, ExamResult, AttendanceStats, AttendanceRecord, User, Homework } from '../types';
import { XIcon, BanknoteIcon, ScrollTextIcon, CalendarIcon, PencilIcon, LoaderIcon, CheckCircleIcon, ChevronLeftIcon, ChevronRightIcon, AwardIcon, ChevronRightIcon as ChevronRightThinIcon, ArrowLeftIcon } from './Icons';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { DateNavigator } from './DateNavigator';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}

export const BaseModal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, icon }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300 transition-colors border dark:border-zinc-800">
        <div className="flex items-center justify-between px-8 py-6 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center bg-blue-600/10 dark:bg-zinc-900 text-blue-600 dark:text-zinc-100 rounded-2xl shadow-sm border border-blue-100 dark:border-zinc-800">
              {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-400 transition-colors">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto scrollbar-hide flex-1">{children}</div>
      </div>
    </div>
  );
};

export const HomeworkModal: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: User }> = ({ isOpen, onClose, currentUser }) => {
  const [loading, setLoading] = useState(false);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (isOpen && currentUser.assignedClass && currentUser.assignedSection) {
      loadHomework();
    }
  }, [isOpen, selectedDate, currentUser]);

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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Daily Homework" icon={<PencilIcon className="w-6 h-6" />}>
      <div className="space-y-6">
        <DateNavigator value={selectedDate} onChange={setSelectedDate} variant="amber" className="mb-4" />

        {loading ? (
            <div className="flex justify-center py-10"><LoaderIcon className="w-8 h-8 animate-spin text-amber-500" /></div>
        ) : homeworkList.length > 0 ? (
            <div className="space-y-4">
                {homeworkList.map((hw) => (
                    <div key={hw.id} className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-slate-100 dark:border-zinc-800 shadow-sm space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase rounded-lg border border-amber-100 dark:border-amber-900">
                                {hw.subject}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-600">{hw.teacherName}</span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-zinc-400 whitespace-pre-wrap leading-relaxed">
                            {hw.content}
                        </p>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-12 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-slate-200 dark:text-zinc-800 mb-4">
                    <ScrollTextIcon className="w-8 h-8" />
                </div>
                <p className="text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest text-[10px]">No homework for this date.</p>
            </div>
        )}
      </div>
    </BaseModal>
  );
};

export const ResultsModal: React.FC<{ isOpen: boolean; onClose: () => void; student: Student }> = ({ isOpen, onClose, student }) => {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setSelectedIndex(null);
      sheetApi.getStudentResults(student.admissionNo).then(res => {
        if (res.success && res.data) {
            setResults([...res.data].reverse());
        }
        setLoading(false);
      });
    }
  }, [isOpen, student.admissionNo]);

  const selectedExam = selectedIndex !== null ? results[selectedIndex] : null;

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={selectedExam ? "Result Details" : "Report Card"} icon={<ScrollTextIcon className="w-6 h-6" />}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
            <LoaderIcon className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-sm font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Fetching Results...</p>
        </div>
      ) : selectedExam ? (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
             <div className="flex items-center gap-3 mb-2">
                <button onClick={() => setSelectedIndex(null)} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-zinc-900 flex items-center justify-center text-slate-400 dark:text-zinc-600 hover:text-indigo-600 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-zinc-100 text-lg tracking-tight leading-none">{selectedExam.examName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mt-1">Detailed Performance</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                 {(() => {
                     const totalObtained = selectedExam.subjects.reduce((sum, s) => sum + s.marks, 0);
                     const totalMax = selectedExam.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
                     const pct = totalMax > 0 ? Math.round((totalObtained/totalMax)*100) : 0;
                     return (
                         <>
                            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-4 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-1">Percentage</p>
                                <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{pct}%</p>
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl text-center">
                                <p className="text-[9px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-widest mb-1">Total Score</p>
                                <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{totalObtained} / {totalMax}</p>
                            </div>
                         </>
                     );
                 })()}
            </div>
            
            <div className="space-y-2.5">
                {selectedExam.subjects.map((sub, sIdx) => (
                  <div key={sIdx} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <div>
                        <span className="text-xs font-black text-slate-500 dark:text-zinc-500 uppercase tracking-wider block mb-0.5">{sub.subject}</span>
                        <div className="h-1 w-24 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(sub.marks/sub.maxMarks)*100}%` }}></div>
                        </div>
                    </div>
                    <span className="text-base font-black text-slate-900 dark:text-zinc-100">{sub.marks} <span className="text-[10px] text-slate-400 dark:text-zinc-600 font-bold ml-1">/ {sub.maxMarks}</span></span>
                  </div>
                ))}
            </div>

            <button onClick={() => window.print()} className="w-full h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                <ScrollTextIcon className="w-5 h-5" />
                Download Report Card
            </button>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
            <div className="px-2 mb-2">
                <p className="text-[10px] font-black text-slate-400 dark:text-zinc-600 uppercase tracking-[0.2em]">Select Examination</p>
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
                        className="w-full bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-3xl p-5 border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                <AwardIcon className="w-6 h-6" />
                            </div>
                            <div className="text-left">
                                <h4 className="font-black text-slate-900 dark:text-zinc-100 text-base tracking-tight leading-none mb-1">{exam.examName}</h4>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">View Results</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className={`text-lg font-black leading-none ${pct >= 40 ? 'text-emerald-500' : 'text-rose-500'}`}>{pct}%</p>
                                <p className="text-[9px] font-bold text-slate-300 dark:text-zinc-700 uppercase mt-0.5">{totalObtained} / {totalMax}</p>
                            </div>
                            <ChevronRightIcon className="w-5 h-5 text-slate-300 dark:text-zinc-700 group-hover:text-indigo-600 transition-colors" />
                        </div>
                      </button>
                    );
                })}
            </div>
        </div>
      ) : (
        <div className="text-center py-12 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 dark:bg-zinc-900 rounded-full flex items-center justify-center text-slate-300 dark:text-zinc-800 mb-4">
                <ScrollTextIcon className="w-8 h-8" />
            </div>
            <p className="text-slate-400 dark:text-zinc-600 font-bold uppercase tracking-widest text-xs">No results recorded yet.</p>
        </div>
      )}
    </BaseModal>
  );
};

export const AttendanceModal: React.FC<{ isOpen: boolean; onClose: () => void; student: Student }> = ({ isOpen, onClose, student }) => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      sheetApi.getStudentAttendance(student.admissionNo).then(res => {
        if (res.success && res.data) setStats(res.data);
        setLoading(false);
      });
    }
  }, [isOpen, student.admissionNo]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const days = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  const firstDay = getFirstDayOfMonth(currentMonth.getFullYear(), currentMonth.getMonth());
  
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= days; i++) calendarDays.push(i);

  const getStatusForDay = (day: number) => {
    if (!stats) return null;
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const record = stats.recentHistory.find(h => {
        const hDate = new Date(h.date);
        const targetDate = new Date(dateStr);
        return hDate.getFullYear() === targetDate.getFullYear() && 
               hDate.getMonth() === targetDate.getMonth() && 
               hDate.getDate() === targetDate.getDate();
    });
    return record?.status;
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(currentMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Attendance Record" icon={<CalendarIcon className="w-6 h-6" />}>
      {loading ? (
        <div className="flex justify-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : stats ? (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0f221e] dark:bg-emerald-950/30 rounded-[2rem] p-6 text-center border-2 border-emerald-500/20 shadow-lg shadow-emerald-500/5">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-2">Presence</p>
              <p className="text-4xl font-black text-emerald-500 tracking-tight">{stats.percentage}%</p>
            </div>
            <div className="bg-[#220f11] dark:bg-rose-950/30 rounded-[2rem] p-6 text-center border-2 border-rose-500/20 shadow-lg shadow-rose-500/5">
              <p className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] mb-2">Absences</p>
              <p className="text-4xl font-black text-rose-500 tracking-tight">{stats.absentCount}</p>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/50 rounded-[2.5rem] p-6 border border-slate-100 dark:border-zinc-800">
             <div className="flex items-center justify-between mb-6 px-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h4>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-400 dark:text-zinc-600"><ChevronLeftIcon className="w-4 h-4" /></button>
                    <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors text-slate-400 dark:text-zinc-600"><ChevronRightIcon className="w-4 h-4" /></button>
                </div>
             </div>

             <div className="grid grid-cols-7 gap-2">
                {['S','M','T','W','T','F','S'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-300 dark:text-zinc-700 uppercase mb-2">{d}</div>
                ))}
                {calendarDays.map((day, idx) => {
                    const status = day ? getStatusForDay(day) : null;
                    return (
                        <div key={idx} className="aspect-square flex items-center justify-center relative">
                            {day && (
                                <div className={`w-full h-full flex items-center justify-center rounded-xl text-xs font-bold transition-all
                                    ${status === 'Present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-105' : 
                                      status === 'Absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 scale-105' : 
                                      'text-slate-400 dark:text-zinc-600'}`}>
                                    {day}
                                </div>
                            )}
                        </div>
                    );
                })}
             </div>
          </div>
        </div>
      ) : <div className="text-center py-12 text-slate-400 dark:text-zinc-700 font-bold">No data available.</div>}
    </BaseModal>
  );
};

export const EditStudentModal: React.FC<{ isOpen: boolean; onClose: () => void; student: Student; onSuccess: () => void; restricted?: boolean }> = ({ isOpen, onClose, student, onSuccess, restricted = false }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Student>({...student});
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
     if (isOpen) {
        setFormData({
            ...student,
            dob: student.dob ? new Date(student.dob).toISOString().split('T')[0] : '',
            joiningDate: student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : ''
        });
        setPhotoFile(null);
     }
  }, [isOpen, student]);

  const handleChange = (e: any) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFileChange = (e: any) => e.target.files?.[0] && setPhotoFile(e.target.files[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await sheetApi.updateStudent(formData, photoFile || undefined);
    if (res.success) { onSuccess(); onClose(); }
    else alert(res.message);
    setLoading(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={restricted ? "Update Roll Number" : "Edit Student Profile"} icon={<PencilIcon className="w-6 h-6" />}>
       <form onSubmit={handleSubmit} className="space-y-4">
          {restricted ? (
            <>
               <div className="p-4 bg-blue-50 dark:bg-zinc-900 rounded-2xl border border-blue-100 dark:border-zinc-800 mb-2">
                   <p className="text-xs font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest mb-1">Student</p>
                   <p className="text-lg font-bold text-slate-900 dark:text-zinc-100">{student.name}</p>
                   <p className="text-xs text-slate-500 dark:text-zinc-600">ID: {student.admissionNo}</p>
               </div>
               <Input label="Roll Number" name="rollNo" value={formData.rollNo} onChange={handleChange} required autoFocus />
            </>
          ) : (
            <>
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 dark:text-zinc-600 uppercase ml-1">Photo</label>
                 <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-slate-500 dark:text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-indigo-50 dark:file:bg-zinc-900 file:text-indigo-700 dark:file:text-indigo-400" />
              </div>
              <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Roll No" name="rollNo" value={formData.rollNo} onChange={handleChange} />
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-600 uppercase ml-1">Class</label>
                    <select name="class" value={formData.class} onChange={handleChange} className="w-full h-12 px-4 bg-slate-100 dark:bg-zinc-900 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#197fe6]/20 outline-none dark:text-zinc-100 transition-colors">
                         {['Playgroup', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-600 uppercase ml-1">Section</label>
                    <select name="section" value={formData.section} onChange={handleChange} className="w-full h-12 px-4 bg-slate-100 dark:bg-zinc-900 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#197fe6]/20 outline-none dark:text-zinc-100 transition-colors">
                         {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-zinc-600 uppercase ml-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full h-12 px-4 bg-slate-100 dark:bg-zinc-900 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#197fe6]/20 outline-none dark:text-zinc-100 transition-colors">
                        <option value="Active">Active</option><option value="Left">Left</option>
                    </select>
                 </div>
              </div>
              <Input label="Primary Phone" name="phone1" value={formData.phone1} onChange={handleChange} required />
            </>
          )}
          
          <div className="pt-2 flex gap-3">
             <Button type="button" variant="outline" onClick={onClose} fullWidth className="h-14">Cancel</Button>
             <Button type="submit" isLoading={loading} fullWidth className="h-14">Save Changes</Button>
          </div>
       </form>
    </BaseModal>
  );
};