
import React, { useState } from 'react';
import { BaseModal } from './StudentActionModals';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { CalendarIcon, LoaderIcon, CheckCircleIcon, XIcon, ShieldCheckIcon, ChevronDownIcon } from './Icons';

interface AcademicYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

export const AcademicYearModal: React.FC<AcademicYearModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [step, setStep] = useState<'CONFIRM' | 'PROCESSING' | 'SUCCESS'>('CONFIRM');
  const [confirmText, setConfirmText] = useState('');
  const [newSessionYear, setNewSessionYear] = useState('2025-26');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [backupUrl, setBackupUrl] = useState('');

  const YEAR_OPTIONS = ['2024-25', '2025-26', '2026-27', '2027-28'];

  const handleStart = async () => {
    if (confirmText !== 'START NEW YEAR') return;
    
    setStep('PROCESSING');
    setLoading(true);
    setProgress('Initializing backup sequence...');
    
    try {
        const res = await sheetApi.request<any>('backupAndNewYear', { 
            confirmedBy: currentUser?.name || 'Admin',
            newYear: newSessionYear
        });
        
        if (res.success) {
            setBackupUrl(res.data.folderUrl);
            setStep('SUCCESS');
        } else {
            alert(res.message || "Failed to complete transition.");
            setStep('CONFIRM');
        }
    } catch (e) {
        alert("A system error occurred.");
        setStep('CONFIRM');
    } finally {
        setLoading(false);
    }
  };

  if (step === 'SUCCESS') {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Session Initialized" icon={<CheckCircleIcon className="w-6 h-6" />}>
        <div className="flex flex-col items-center text-center space-y-6 py-6">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 mb-2">
                <CheckCircleIcon className="w-12 h-12" />
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Transition Complete!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    Your school is now ready for the new academic session ({newSessionYear}). All previous data has been securely archived.
                </p>
            </div>
            
            <a 
                href={backupUrl} 
                target="_blank" 
                rel="noreferrer"
                className="w-full h-14 bg-slate-100 dark:bg-[#1e293b] rounded-2xl flex items-center justify-center gap-3 font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 transition-all border border-slate-200 dark:border-white/5"
            >
                <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-5 h-5" alt="Drive" />
                View Backup Folder
            </a>

            <Button fullWidth onClick={() => { window.location.reload(); }} className="h-14">Finish & Restart</Button>
        </div>
      </BaseModal>
    );
  }

  if (step === 'PROCESSING') {
      return (
          <BaseModal isOpen={isOpen} onClose={() => {}} title="Transitioning Session" icon={<LoaderIcon className="w-6 h-6 animate-spin" />}>
              <div className="flex flex-col items-center justify-center space-y-8 py-12">
                  <div className="relative">
                      <div className="w-24 h-24 rounded-full border-4 border-[#197fe6]/10 border-t-[#197fe6] animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center text-[#197fe6]">
                          <ShieldCheckIcon className="w-8 h-8" />
                      </div>
                  </div>
                  <div className="text-center space-y-2">
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Processing Data...</h4>
                      <p className="text-slate-400 dark:text-slate-500 text-sm animate-pulse">{progress}</p>
                  </div>
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-full border border-amber-100 dark:border-amber-900/50">
                      Do not close your browser
                  </p>
              </div>
          </BaseModal>
      );
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Transition Safety" icon={<ShieldCheckIcon className="w-6 h-6 text-red-500" />}>
        <div className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50">
                <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Critical Action Required</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/60 leading-relaxed">
                    You are about to clear the current academic ledger. While a backup will be created in your Google Drive, the live database will be reset for the new session selected below.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upcoming Academic Year</label>
                    <div className="relative">
                        <select 
                            value={newSessionYear}
                            onChange={(e) => setNewSessionYear(e.target.value)}
                            className="w-full h-12 pl-4 pr-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-red-500/20"
                        >
                            {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                        <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-1.5 text-center pt-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type the following to confirm:</label>
                    <p className="text-lg font-mono font-bold text-slate-900 dark:text-white select-none">START NEW YEAR</p>
                </div>
                
                <Input 
                    placeholder="..." 
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value.toUpperCase())}
                    className="text-center h-14 text-lg font-black tracking-widest uppercase focus:ring-red-500/20"
                    autoFocus
                />
            </div>

            <div className="flex gap-3 pt-2">
                <Button variant="outline" fullWidth onClick={onClose} className="h-14">Cancel</Button>
                <Button 
                    variant="danger" 
                    fullWidth 
                    onClick={handleStart}
                    disabled={confirmText !== 'START NEW YEAR'}
                    className={`h-14 transition-all ${confirmText === 'START NEW YEAR' ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'}`}
                >
                    Initialize Transition
                </Button>
            </div>
        </div>
    </BaseModal>
  );
};
