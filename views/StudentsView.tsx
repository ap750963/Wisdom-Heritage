
import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, SearchIcon, PlusIcon, ChevronDownIcon, FilterIcon, LoaderIcon } from '../components/Icons';
import { Student, User, UserRole } from '../types';
import { AddStudentModal } from '../components/AddStudentModal';
import { sheetApi } from '../services/SheetApi';
import { StudentProfileView } from './StudentProfileView';

interface StudentsViewProps {
  onBack: () => void;
  onProfileViewChange?: (isOpen: boolean) => void;
  currentUser: User | null;
}

export const StudentsView: React.FC<StudentsViewProps> = ({ onBack, onProfileViewChange, currentUser }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilters, setSectionFilters] = useState<Record<string, string>>({});
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({});

  const isTeacher = currentUser?.role === UserRole.TEACHER;
  const canModifyStudents = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGEMENT;

  useEffect(() => {
    const loadStudents = async () => {
      setIsLoading(true);
      try {
        const response = await sheetApi.getStudents(currentUser);
        if (response.success && response.data) {
          setStudents(response.data);
          if (isTeacher && currentUser?.assignedClass) setExpandedClasses({ [currentUser.assignedClass]: true });
        }
      } finally { setIsLoading(false); }
    };
    loadStudents();
  }, [refreshTrigger, currentUser]);

  useEffect(() => { if (onProfileViewChange) onProfileViewChange(!!selectedStudent); }, [selectedStudent, onProfileViewChange]);

  const handleStudentAdded = () => setRefreshTrigger(prev => prev + 1);
  const getClassWeight = (className: string) => {
    const c = className.toLowerCase().trim();
    if (c.includes('play')) return -4; if (c.includes('nurs')) return -3; if (c.includes('lkg')) return -2; if (c.includes('ukg')) return -1;
    const num = parseInt(c); return isNaN(num) ? 999 : num;
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.admissionNo.includes(searchQuery));
  const groupedStudents = filteredStudents.reduce((acc, s) => {
      const cls = s.class || 'Unassigned'; if (!acc[cls]) acc[cls] = []; acc[cls].push(s); return acc;
  }, {} as Record<string, Student[]>);
  const sortedClassKeys = Object.keys(groupedStudents).sort((a, b) => getClassWeight(a) - getClassWeight(b));

  const toggleClass = (cls: string) => setExpandedClasses(prev => ({ ...prev, [cls]: !prev[cls] }));
  const handleSectionFilterChange = (cls: string, section: string) => setSectionFilters(prev => ({ ...prev, [cls]: section }));
  const getOptimizedPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('id=')) { const id = url.match(/id=([^&]+)/)?.[1]; return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1000` : url; }
    return url;
  };

  if (selectedStudent && canModifyStudents) return <StudentProfileView studentId={selectedStudent.admissionNo} initialData={selectedStudent} currentUser={currentUser} onBack={() => { setSelectedStudent(null); setRefreshTrigger(p => p + 1); }} />;

  return (
    <div className="flex flex-col min-h-screen bg-black transition-colors">
      <div className="bg-[#197fe6] px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
          <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                  <h2 className="text-xl font-bold tracking-wide">Students</h2>
              </div>
              {canModifyStudents && (
                <button onClick={() => setIsAddStudentModalOpen(true)} className="flex items-center gap-2 px-5 h-10 rounded-xl bg-white text-[#197fe6] shadow-lg active:scale-95 font-bold text-xs"><PlusIcon className="w-4 h-4" /><span>Add Student</span></button>
              )}
          </div>
      </div>

      <div className="w-full px-6 pb-32 flex flex-col gap-6 mt-8 relative z-10">
          <div className="relative group w-full">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5 text-zinc-600 group-focus-within:text-[#197fe6] transition-colors" />
            </div>
            <input className="block w-full pl-12 pr-4 h-14 border-none rounded-[1.5rem] bg-zinc-900 text-white shadow-soft outline-none focus:ring-2 focus:ring-[#197fe6]/20 transition-all font-medium" placeholder="Search students..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {isLoading && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-600 animate-in fade-in duration-700">
                <LoaderIcon className="w-10 h-10 animate-spin mb-4 text-[#197fe6]/40" />
                <p className="text-sm font-bold tracking-wide uppercase">Syncing Directory</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {sortedClassKeys.length > 0 ? (
                    <div className="space-y-4">
                        {sortedClassKeys.map(cls => {
                            const activeSection = sectionFilters[cls] || '', displayStudents = groupedStudents[cls].filter(s => (isTeacher ? true : activeSection === '' || s.section === activeSection)).sort((a,b) => a.name.localeCompare(b.name)), isExpanded = !!expandedClasses[cls];
                            return (
                                <div key={cls} className="bg-zinc-900 rounded-[1.5rem] shadow-sm border-none overflow-hidden">
                                    <div onClick={() => toggleClass(cls)} className="w-full flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800 transition-colors select-none"><div className="flex items-center gap-3"><div className={`w-10 h-10 rounded-[0.8rem] flex items-center justify-center font-bold text-sm shadow-sm transition-colors ${isExpanded ? 'bg-[#197fe6] text-white' : 'bg-zinc-800 text-zinc-400'}`}>{(!isNaN(Number(cls))) ? cls : cls.charAt(0)}</div><div className="text-left"><h3 className="text-base font-bold text-white leading-none">{(!isNaN(Number(cls))) ? `Class ${cls}` : cls}</h3><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mt-1">{displayStudents.length} Students</p></div></div><div className="flex items-center gap-3">{!isTeacher && (<div onClick={(e) => e.stopPropagation()}><select value={activeSection} onChange={(e) => handleSectionFilterChange(cls, e.target.value)} className="h-8 pl-3 pr-8 bg-zinc-800 border-none rounded-lg text-xs font-bold text-zinc-400 outline-none appearance-none cursor-pointer"><option value="">Section: All</option>{['A', 'B', 'C', 'D'].map(sec => <option key={sec} value={sec}>{sec}</option>)}</select></div>)}<ChevronDownIcon className={`w-5 h-5 text-zinc-700 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} /></div></div>
                                    {isExpanded && (<div className="p-3 bg-zinc-950/50"><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{displayStudents.map(s => (<div key={s.admissionNo} onClick={() => canModifyStudents && setSelectedStudent(s)} className={`group bg-zinc-900 rounded-[1.2rem] p-3 shadow-sm transition-all border-none flex items-center gap-3 ${canModifyStudents ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}><img src={getOptimizedPhotoUrl(s.photoUrl) || `https://ui-avatars.com/api/?background=random&name=${s.name}`} className="w-12 h-12 rounded-[0.8rem] object-cover bg-zinc-800 shadow-inner border-none" referrerPolicy="no-referrer" onError={(e) => {(e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?background=random&name=${s.name}`}} /><div className="flex flex-col min-w-0 flex-1"><h3 className="text-white text-sm font-bold truncate mb-0.5">{s.name}</h3><p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">ID: {s.admissionNo} • Sec {s.section}</p></div></div>))}</div></div>)}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-zinc-900 rounded-[2.5rem] border-none shadow-sm mx-auto w-full max-w-lg mt-8">
                        <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-zinc-700">
                            <FilterIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-white font-bold text-lg">No students found</h3>
                    </div>
                )}
            </div>
          )}
      </div>
      <AddStudentModal isOpen={isAddStudentModalOpen} onClose={() => setIsAddStudentModalOpen(false)} onSuccess={handleStudentAdded} />
    </div>
  );
};
