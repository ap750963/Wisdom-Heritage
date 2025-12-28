
import React, { useState, useEffect } from 'react';
import { BaseModal } from './StudentActionModals';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { Student } from '../types';
import { KeyIcon, LockIcon, LoaderIcon, UserIcon, CheckCircleIcon, ShieldCheckIcon } from './Icons';

interface StudentUserAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
}

export const StudentUserAccessModal: React.FC<StudentUserAccessModalProps> = ({ isOpen, onClose, student }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  
  const [existingUser, setExistingUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(true);
      
      sheetApi.getUserForStudent(student.admissionNo).then(res => {
        if (res.success && res.data) {
          setFormData({
            username: res.data.username,
            password: res.data.password || '', 
          });
          setExistingUser(true);
        } else {
          // Intelligent username suggestion: firstname.admissionyear
          const firstName = student.name.split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
          const joinYear = student.admissionNo.substring(0, 4);
          
          setFormData({
            username: `${firstName}.${joinYear}`,
            password: '',
          });
          setExistingUser(false);
        }
        setLoading(false);
      });
    }
  }, [isOpen, student]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
        setError('Username and Password are required.');
        return;
    }
    
    setError('');
    setSaving(true);

    try {
        const payload = {
            username: formData.username,
            password: formData.password,
            admissionNo: student.admissionNo,
            name: student.name
        };

        const res = await sheetApi.saveStudentUserAccess(payload);
        if (res.success) {
            onClose();
        } else {
            setError(res.message || 'Failed to save access settings.');
        }
    } catch(err) {
        setError('An unexpected error occurred.');
    } finally {
        setSaving(false);
    }
  };

  const handleRemove = async () => {
      if (!confirm("Revoke system access for this student? They will no longer be able to log in.")) return;
      setRemoving(true);
      try {
          const res = await sheetApi.removeStudentUserAccess(student.admissionNo);
          if (res.success) {
              onClose();
          } else {
              alert(res.message);
          }
      } catch(e) {
          alert('Failed to remove access.');
      } finally {
          setRemoving(false);
      }
  };

  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Student Portal Access" 
        icon={<KeyIcon className="w-6 h-6" />}
    >
       {loading ? (
           <div className="flex justify-center p-12"><LoaderIcon className="w-10 h-10 animate-spin text-slate-400" /></div>
       ) : (
           <form onSubmit={handleSave} className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
               <div className="flex items-center gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                   <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-600">
                        <ShieldCheckIcon className="w-6 h-6" />
                   </div>
                   <div>
                       <p className="text-xs font-bold text-blue-400 dark:text-blue-500 uppercase tracking-widest leading-none mb-1">Provisioning Account</p>
                       <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{student.name}</h4>
                   </div>
               </div>

               {error && (
                   <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold border border-red-100 dark:border-red-900/30">
                       {error}
                   </div>
               )}
               
               <div className="space-y-4">
                   <div className="space-y-1.5">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Student Username</label>
                       <Input 
                            name="username" 
                            value={formData.username} 
                            onChange={handleChange} 
                            required 
                            icon={<UserIcon />}
                            placeholder="e.g. john.2024"
                            className="bg-slate-50 dark:bg-slate-800/50 border-none h-14"
                       />
                       <p className="text-[9px] text-slate-400 dark:text-slate-500 italic ml-1">Must be unique across the entire school system.</p>
                   </div>
                   
                   <div className="space-y-1.5 pt-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Login Password</label>
                       <Input 
                           type="text" 
                           name="password" 
                           value={formData.password} 
                           onChange={handleChange} 
                           required 
                           icon={<LockIcon />}
                           placeholder="Set initial password"
                           className="bg-slate-50 dark:bg-slate-800/50 border-none h-14"
                       />
                   </div>
               </div>

               <div className="pt-4 flex flex-col gap-3">
                   <Button 
                        type="submit" 
                        isLoading={saving} 
                        fullWidth 
                        className="h-14 shadow-xl shadow-blue-500/20"
                    >
                       <CheckCircleIcon className="w-5 h-5 mr-2" />
                       {existingUser ? 'Update Account Access' : 'Enable Student Portal Access'}
                   </Button>
                   
                   {existingUser && (
                       <button
                           type="button" 
                           onClick={handleRemove}
                           disabled={removing}
                           className="text-xs font-bold text-red-500 hover:text-red-600 py-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                       >
                           {removing ? 'Removing...' : 'Revoke Student Access'}
                       </button>
                   )}
                   
                   {!existingUser && (
                        <button
                           type="button" 
                           onClick={onClose}
                           className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2"
                        >
                           Not Now
                        </button>
                   )}
               </div>
           </form>
       )}
    </BaseModal>
  );
};
