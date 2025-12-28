
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeftIcon, 
  LoaderIcon, 
  CheckCircleIcon,
  SearchIcon,
  UserIcon,
  PlusIcon,
  DownloadIcon,
  CalendarIcon,
  ClockIcon,
  XIcon,
  HalfDayIcon
} from '../components/Icons';
import { Employee, User } from '../types';
import { sheetApi } from '../services/SheetApi';
import { DateNavigator } from '../components/DateNavigator';
import { EmployeeProfileView } from './EmployeeProfileView';
import { EmployeeModal } from '../components/EmployeeActionModals';

interface StaffAttendanceViewProps {
  onBack: () => void;
  currentUser: User | null;
}

export const StaffAttendanceView: React.FC<StaffAttendanceViewProps> = ({ onBack, currentUser }) => {
  const [employees, setEmployees] = useState<(Employee & { status: string | null })[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await sheetApi.getStaffAttendance(selectedDate);
      if (res.success && res.data) {
        setEmployees(res.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const updateStatus = (id: string, status: string) => {
    setEmployees(prev => prev.map(emp => 
      emp.employeeId === id ? { ...emp, status } : emp
    ));
  };

  const handleSubmit = async () => {
    const list = employees
      .filter(e => e.status !== null)
      .map(e => ({ employeeId: e.employeeId, status: e.status! }));
    
    if (list.length === 0) return alert("Please mark attendance for at least one employee.");

    setSubmitting(true);
    try {
      const res = await sheetApi.markStaffAttendance(selectedDate, list);
      if (res.success) {
        alert("Staff attendance updated successfully.");
      } else {
        alert(res.message || "Failed to update attendance.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.post.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = useMemo(() => {
    const present = employees.filter(e => e.status === 'Present' || e.status === 'Late').length;
    const absent = employees.filter(e => e.status === 'Absent').length;
    const halfDay = employees.filter(e => e.status === 'Half Day').length;
    return { present, absent, halfDay };
  }, [employees]);

  const getOptimizedPhotoUrl = (url?: string) => {
    if (!url) return '';
    const idMatch = url.match(/id=([^&]+)/);
    if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    return url;
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = ['Date', 'Employee ID', 'Name', 'Post', 'Status'];
    const rows = filtered.map(emp => [
      selectedDate,
      emp.employeeId,
      `"${emp.name}"`,
      `"${emp.post}"`,
      emp.status || 'Not Marked'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Staff_Attendance_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleMarkHoliday = async () => {
    if (employees.length === 0) return;
    
    if (!window.confirm(`Mark all staff as 'Absent' (Holiday) for ${selectedDate}?`)) {
      return;
    }

    const list = employees.map(e => ({ employeeId: e.employeeId, status: 'Absent' }));
    
    setSubmitting(true);
    try {
      const res = await sheetApi.markStaffAttendance(selectedDate, list);
      if (res.success) {
        setEmployees(prev => prev.map(emp => ({ ...emp, status: 'Absent' })));
        alert("Marked as holiday successfully.");
      } else {
        alert(res.message || "Failed to mark holiday.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (selectedEmployeeId) {
    return (
      <EmployeeProfileView 
        employeeId={selectedEmployeeId} 
        onBack={() => { setSelectedEmployeeId(null); fetchData(); }} 
        currentUser={currentUser} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6fc] dark:bg-black transition-colors">
      <div className="bg-purple-600 px-6 py-6 pb-12 rounded-b-[3rem] shadow-lg sticky top-0 z-50 shrink-0 w-full transition-all">
          <div className="flex items-center justify-between text-white mb-6">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                  <div className="flex flex-col">
                      <h2 className="text-2xl font-bold tracking-tight leading-none">Staff</h2>
                  </div>
              </div>
              <button 
                onClick={() => setIsAddStaffOpen(true)} 
                className="flex items-center gap-2 px-5 h-10 rounded-xl bg-white text-purple-600 shadow-lg active:scale-95 font-bold text-xs"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Staff</span>
              </button>
          </div>
          
          <div className="flex items-center gap-3">
              <DateNavigator value={selectedDate} onChange={setSelectedDate} variant="purple" className="flex-1 h-[54px]" />
              <button 
                onClick={handleMarkHoliday}
                className="h-[54px] w-[54px] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-white rounded-[1.2rem] flex flex-col items-center justify-center gap-0.5 active:scale-95 transition-all"
                title="Mark Holiday"
              >
                <CalendarIcon className="w-5 h-5" />
                <span className="text-[7px] font-black uppercase tracking-widest leading-none">Holiday</span>
              </button>
          </div>
      </div>

      <div className="w-full px-6 pb-48 flex flex-col gap-6 mt-8 relative z-10">
          <div className="flex items-center gap-3">
              <div className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-sm border-none flex flex-col items-center">
                  <p className="text-[8px] font-black text-purple-600 uppercase tracking-widest mb-1">Present</p>
                  <p className="text-lg font-black text-purple-600 leading-none">{stats.present}</p>
              </div>
              <div className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-sm border-none flex flex-col items-center">
                  <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Absent</p>
                  <p className="text-lg font-black text-rose-600 leading-none">{stats.absent}</p>
              </div>
              <div className="flex-1 bg-white dark:bg-zinc-900 p-3 rounded-2xl shadow-sm border-none flex flex-col items-center">
                  <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Half Day</p>
                  <p className="text-lg font-black text-indigo-600 leading-none">{stats.halfDay}</p>
              </div>
              <button 
                onClick={handleExport}
                className="h-[54px] px-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border-none flex flex-col items-center justify-center gap-0.5 active:scale-95 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all group"
              >
                  <DownloadIcon className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Export</p>
              </button>
          </div>

          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              className="block w-full pl-12 pr-4 h-14 border-none rounded-2xl bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-soft outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-medium placeholder:text-slate-400" 
              placeholder="Search staff..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <LoaderIcon className="w-10 h-10 animate-spin mb-4 text-purple-600" />
              <p className="text-xs font-black tracking-widest uppercase">Fetching Directory...</p>
            </div>
          ) : filtered.length > 0 ? (
              <div className="space-y-4">
                  {filtered.map(emp => {
                      const photoSrc = getOptimizedPhotoUrl(emp.photoUrl);
                      const status = emp.status;
                      
                      return (
                        <div 
                            key={emp.employeeId} 
                            onClick={() => setSelectedEmployeeId(emp.employeeId)}
                            className="bg-white dark:bg-zinc-900 p-5 rounded-[2rem] shadow-sm hover:shadow-md border-none flex flex-col gap-4 cursor-pointer transition-all active:scale-[0.98] group"
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                {photoSrc ? (
                                    <img src={photoSrc} className="w-14 h-14 rounded-2xl object-cover bg-slate-50 dark:bg-zinc-800 border-none shrink-0 shadow-inner" alt="" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`)} />
                                ) : (
                                    <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 font-bold text-xl shrink-0">{emp.name.charAt(0)}</div>
                                )}
                                <div className="min-w-0 flex flex-col gap-0.5">
                                    <h4 className="text-base font-bold text-slate-900 dark:text-white truncate leading-tight group-hover:text-purple-600 transition-colors">{emp.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{emp.post} • {emp.employeeId}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
                                <button 
                                    onClick={() => updateStatus(emp.employeeId, 'Present')}
                                    title="Present"
                                    className={`h-11 rounded-xl transition-all flex items-center justify-center border-2 ${
                                        status === 'Present' 
                                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                                            : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 hover:border-emerald-200'
                                    }`}
                                >
                                    <CheckCircleIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => updateStatus(emp.employeeId, 'Absent')}
                                    title="Absent"
                                    className={`h-11 rounded-xl transition-all flex items-center justify-center border-2 ${
                                        status === 'Absent' 
                                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg' 
                                            : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 hover:border-rose-200'
                                    }`}
                                >
                                    <XIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => updateStatus(emp.employeeId, 'Late')}
                                    title="Late"
                                    className={`h-11 rounded-xl transition-all flex items-center justify-center border-2 ${
                                        status === 'Late' 
                                            ? 'bg-amber-500 border-amber-500 text-white shadow-lg' 
                                            : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 hover:border-amber-200'
                                    }`}
                                >
                                    <ClockIcon className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => updateStatus(emp.employeeId, 'Half Day')}
                                    title="Half Day"
                                    className={`h-11 rounded-xl transition-all flex items-center justify-center border-2 ${
                                        status === 'Half Day' 
                                            ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' 
                                            : 'bg-white dark:bg-zinc-800 border-slate-100 dark:border-zinc-700 text-slate-400 hover:border-indigo-200'
                                    }`}
                                >
                                    <HalfDayIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                      );
                  })}
              </div>
          ) : (
            <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-2 border-dashed border-slate-100 dark:border-zinc-800 flex flex-col items-center">
                <UserIcon className="w-12 h-12 text-slate-200 mb-4" />
                <p className="font-bold text-slate-400 text-sm uppercase tracking-widest">No matching results found.</p>
            </div>
          )}
      </div>

      <div className="fixed bottom-28 left-6 right-6 z-[60] md:bottom-10 md:right-10 md:left-auto md:w-auto">
        <button 
          onClick={handleSubmit} 
          disabled={submitting || loading}
          className="w-full md:w-auto h-12 bg-purple-600 rounded-xl md:rounded-full shadow-lg text-white flex items-center justify-center gap-2 px-6 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
        >
          {submitting ? <LoaderIcon className="w-5 h-5 animate-spin" /> : <CheckCircleIcon className="w-5 h-5" />}
          <span className="font-bold tracking-wider text-xs uppercase">Update Attendance</span>
        </button>
      </div>

      <EmployeeModal isOpen={isAddStaffOpen} onClose={() => setIsAddStaffOpen(false)} onSuccess={fetchData} />
    </div>
  );
};
