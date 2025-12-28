
import React, { useState, useEffect } from 'react';
import { BaseModal } from './StudentActionModals';
import { Student, User } from '../types';
import { sheetApi } from '../services/SheetApi';
import { LoaderIcon, ShieldCheckIcon, PrinterIcon, DownloadIcon, WisdomLogo } from './Icons';

interface IdCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  currentUser?: User | null;
}

export const IdCardModal: React.FC<IdCardModalProps> = ({ isOpen, onClose, studentId, currentUser }) => {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && studentId) {
      setLoading(true);
      setError('');
      sheetApi.getStudentDetails(studentId, currentUser).then(res => {
        if (res.success && res.data) {
            setStudent(res.data);
        } else {
            setError(res.message || 'Failed to retrieve student record.');
        }
        setLoading(false);
      }).catch(() => {
          setError('Network error: Unable to load student data.');
          setLoading(false);
      });
    }
  }, [isOpen, studentId, currentUser]);

  const handlePrint = () => {
    window.print();
  };

  const getOptimizedPhotoUrl = (url?: string) => {
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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Digital ID Card" icon={<ShieldCheckIcon className="w-6 h-6" />}>
      {loading ? (
        <div className="flex justify-center py-12"><LoaderIcon className="w-10 h-10 animate-spin text-blue-500" /></div>
      ) : student ? (
        <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-300">
            {/* The ID Card Visual */}
            <div id="id-card-element" className="w-[320px] h-[520px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border-2 border-slate-100 flex flex-col relative print:shadow-none print:border-0">
                {/* Header Decoration */}
                <div className="h-28 bg-gradient-to-br from-indigo-600 to-indigo-800 flex flex-col items-center justify-center relative p-4">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
                    <div className="bg-white p-1.5 rounded-xl shadow-lg z-10 mb-1">
                        <WisdomLogo className="h-10 w-10" />
                    </div>
                    <h1 className="text-white text-xs font-black uppercase tracking-widest z-10">Wisdom Heritage</h1>
                    <p className="text-[8px] text-indigo-200 font-bold uppercase tracking-[0.2em] z-10">Academic Excellence</p>
                </div>

                {/* Photo Area */}
                <div className="flex flex-col items-center -mt-10 px-6 relative z-20">
                    <div className="w-32 h-32 rounded-[2rem] border-[6px] border-white shadow-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                        <img 
                            src={getOptimizedPhotoUrl(student.photoUrl) || `https://ui-avatars.com/api/?name=${student.name}&background=random`} 
                            className="w-full h-full object-cover" 
                            alt={student.name}
                            referrerPolicy="no-referrer"
                        />
                    </div>
                    
                    <div className="mt-4 text-center">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none mb-1">{student.name}</h2>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                             STUDENT • Class {student.class}
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="flex-1 p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Adm. No</p>
                            <p className="text-xs font-bold text-slate-800">{student.admissionNo}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Roll No</p>
                            <p className="text-xs font-bold text-slate-800">{student.rollNo || '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DOB</p>
                            <p className="text-xs font-bold text-slate-800">{student.dob ? new Date(student.dob).toLocaleDateString() : '-'}</p>
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                            <p className="text-xs font-bold text-slate-800">{student.phone1}</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Residential Address</p>
                        <p className="text-[10px] font-bold text-slate-600 leading-tight line-clamp-2">{student.address || 'Registered Student Address'}</p>
                    </div>

                    <div className="pt-4 mt-auto border-t border-slate-50 flex items-center justify-between">
                         <div className="flex flex-col">
                             <p className="text-[10px] font-black text-indigo-600">Wisdom Heritage</p>
                             <p className="text-[8px] font-bold text-slate-400">SESSION 2024 - 25</p>
                         </div>
                         <div className="flex flex-col items-center">
                            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center opacity-40">
                                <svg className="w-6 h-6 text-slate-400" fill="currentColor" viewBox="0 0 24 24"><path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg>
                            </div>
                            <p className="text-[6px] font-black text-slate-300 uppercase mt-1 tracking-tighter">Scan to Verify</p>
                         </div>
                    </div>
                </div>
                
                {/* Footer Stripe */}
                <div className="h-2 bg-indigo-600"></div>
            </div>

            {/* Actions */}
            <div className="w-full flex gap-3">
                <button 
                    onClick={handlePrint}
                    className="flex-1 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-all"
                >
                    <PrinterIcon className="w-4 h-4" />
                    Print ID
                </button>
                <button 
                    className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                >
                    <DownloadIcon className="w-4 h-4" />
                    Download
                </button>
            </div>
            <p className="text-[10px] text-slate-400 font-medium italic text-center max-w-[250px]">Note: This is a system-generated Digital ID for authorized use within the school premises.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500 mb-4">
                <ShieldCheckIcon className="w-8 h-8" />
            </div>
            <p className="text-slate-900 dark:text-white font-bold mb-1">Retrieval Failed</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[220px]">{error || 'ID data could not be matched with your account.'}</p>
        </div>
      )}
    </BaseModal>
  );
};