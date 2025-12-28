import React, { useState, useEffect } from 'react';
import { SearchIcon, LoaderIcon, UserIcon, XIcon } from './Icons';
import { sheetApi } from '../services/SheetApi';
import { Student } from '../types';
import { BaseModal } from './StudentActionModals';

interface StudentSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (student: Student) => void;
  title?: string;
}

export const StudentSearchModal: React.FC<StudentSearchModalProps> = ({ isOpen, onClose, onSelect, title = "Search Student" }) => {
  const [query, setQuery] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (isOpen && allStudents.length === 0) {
      setLoading(true);
      sheetApi.getStudents().then(res => {
        if (res.success && res.data) {
          setAllStudents(res.data);
        }
        setLoading(false);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query) {
      setStudents([]);
      return;
    }
    const lowerQ = query.toLowerCase();
    const filtered = allStudents.filter(s => 
      s.name.toLowerCase().includes(lowerQ) || 
      s.admissionNo.includes(lowerQ)
    ).slice(0, 10);
    setStudents(filtered);
  }, [query, allStudents]);

  const defaultImage = "https://ui-avatars.com/api/?background=random&name=";
  const getOptimizedPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com/uc?export=view')) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) {
        return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
      }
    }
    return url;
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={title} icon={<SearchIcon className="w-6 h-6" />}>
       <div className="space-y-6">
          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <SearchIcon className="w-5 h-5" />
             </div>
             <input 
               autoFocus
               type="text" 
               className="w-full h-14 pl-12 pr-4 bg-slate-50 dark:bg-slate-700 border border-transparent rounded-2xl focus:bg-white focus:border-[#197fe6] focus:ring-4 focus:ring-[#197fe6]/10 outline-none transition-all font-medium dark:text-white"
               placeholder="Type name or admission number..."
               value={query}
               onChange={(e) => setQuery(e.target.value)}
             />
          </div>

          <div className="min-h-[200px]">
             {loading ? (
                <div className="flex justify-center py-10"><LoaderIcon className="w-8 h-8 animate-spin text-[#197fe6]" /></div>
             ) : students.length > 0 ? (
                <div className="space-y-2">
                   {students.map(s => {
                      const photoSrc = getOptimizedPhotoUrl(s.photoUrl) || defaultImage + s.name;
                      return (
                        <button 
                           key={s.admissionNo}
                           onClick={() => onSelect(s)}
                           className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-600 group text-left"
                        >
                           <img 
                              src={photoSrc} 
                              className="w-10 h-10 rounded-xl object-cover bg-slate-200 dark:bg-slate-600" 
                              alt="" 
                              referrerPolicy="no-referrer"
                              onError={(e) => (e.target as HTMLImageElement).src = defaultImage + s.name}
                           />
                           <div>
                              <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#197fe6] transition-colors">{s.name}</p>
                              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Class {s.class}-{s.section} • ID: {s.admissionNo}</p>
                           </div>
                        </button>
                      );
                   })}
                </div>
             ) : query ? (
                <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-sm font-medium">No students found.</div>
             ) : (
                <div className="text-center py-10 text-slate-300 dark:text-slate-600 text-sm font-medium">Start typing to search...</div>
             )}
          </div>
       </div>
    </BaseModal>
  );
};