import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, SearchIcon, PlusIcon, LoaderIcon, FilterIcon, DownloadIcon, CheckSquareIcon } from '../components/Icons';
import { Employee, User } from '../types';
import { sheetApi } from '../services/SheetApi';
import { EmployeeModal } from '../components/EmployeeActionModals';
import { EmployeeProfileView } from './EmployeeProfileView';

interface EmployeesViewProps {
  onBack: () => void;
  onProfileViewChange?: (isOpen: boolean) => void;
  onMarkAttendance: () => void;
  currentUser: User | null;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ onBack, onProfileViewChange, onMarkAttendance, currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoading(true);
      try {
        const response = await sheetApi.getEmployees();
        if (response.success && response.data) setEmployees(response.data);
      } finally { setIsLoading(false); }
    };
    loadEmployees();
  }, [refreshTrigger]);

  useEffect(() => { if (onProfileViewChange) onProfileViewChange(!!selectedEmployee); }, [selectedEmployee, onProfileViewChange]);

  const handleSuccess = () => setRefreshTrigger(prev => prev + 1);
  const filteredEmployees = employees.filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()) || emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) || emp.post.toLowerCase().includes(searchQuery.toLowerCase())).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  const getOptimizedPhotoUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/uc?export=view')) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }
    return url;
  };

  if (selectedEmployee) return <EmployeeProfileView employeeId={selectedEmployee.employeeId} onBack={() => { setSelectedEmployee(null); setRefreshTrigger(p => p+1); }} currentUser={currentUser} />;

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6fc] dark:bg-black transition-colors duration-200">
      <div className="bg-purple-600 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
          <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                  <h2 className="text-xl font-bold tracking-wide">Staff</h2>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-5 h-10 rounded-xl bg-white text-purple-600 shadow-lg active:scale-95 font-bold text-xs"><PlusIcon className="w-4 h-4" /><span>Add Staff</span></button>
              </div>
          </div>
      </div>

      <div className="w-full px-6 pb-48 flex flex-col gap-6 mt-8 relative z-10">
        <div className="relative group"><div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-slate-400 group-focus-within:text-purple-500 transition-colors" /></div><input className="block w-full pl-12 pr-4 h-14 border-none rounded-[1.5rem] bg-white dark:bg-zinc-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 shadow-soft transition-all font-medium" placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
        {isLoading ? <div className="flex flex-col items-center justify-center py-20 text-slate-400"><LoaderIcon className="w-10 h-10 animate-spin mb-4 text-purple-500" /><p className="text-sm font-bold tracking-wide uppercase">Loading Staff...</p></div> : filteredEmployees.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEmployees.map(emp => {
                   const photoSrc = getOptimizedPhotoUrl(emp.photoUrl);
                   return (
                    <div key={emp.employeeId} onClick={() => setSelectedEmployee(emp)} className="group bg-white dark:bg-zinc-900 rounded-[2rem] p-4 shadow-soft hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border-none flex items-center gap-4"><div className="relative shrink-0">{photoSrc ? (<img src={photoSrc} className="w-16 h-16 rounded-[1.2rem] object-cover bg-slate-100 dark:bg-zinc-800 shadow-inner" alt={emp.name} referrerPolicy="no-referrer" />) : (<div className="w-16 h-16 rounded-[1.2rem] bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold text-2xl border-none">{emp.name.charAt(0)}</div>)}</div><div className="flex flex-col min-w-0 flex-1"><h3 className="text-slate-900 dark:text-white text-base font-bold truncate mb-1">{emp.name}</h3><span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 max-w-full truncate">{emp.post}</span><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">ID: {emp.employeeId}</p></div></div>
                )})}
            </div>
        ) : <div className="text-center py-24 bg-white dark:bg-zinc-900 rounded-[2.5rem] border-none shadow-sm mx-auto w-full max-w-lg mt-8"><div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300"><FilterIcon className="w-8 h-8" /></div><h3 className="text-slate-900 dark:text-white font-bold text-lg">No staff found</h3></div>}
      </div>

      <div className="fixed bottom-28 left-6 right-6 z-[60] md:bottom-10 md:right-10 md:left-auto md:w-auto">
        <button 
          onClick={onMarkAttendance} 
          className="w-full md:w-auto h-12 bg-purple-600 rounded-xl md:rounded-full shadow-lg text-white flex items-center justify-center gap-2 px-6 hover:scale-105 active:scale-95 transition-all"
        >
          <CheckSquareIcon className="w-5 h-5" />
          <span className="font-bold tracking-wider text-xs uppercase">Mark Attendance</span>
        </button>
      </div>

      <EmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleSuccess} />
    </div>
  );
};