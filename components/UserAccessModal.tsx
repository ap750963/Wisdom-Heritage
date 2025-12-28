import React, { useState, useEffect } from 'react';
import { BaseModal } from './StudentActionModals';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { Employee, UserRole } from '../types';
import { KeyIcon, LockIcon, LoaderIcon, UserIcon, SchoolIcon, CheckCircleIcon, CalendarIcon, BriefcaseIcon, ShieldCheckIcon } from './Icons';

interface UserAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  onSuccess: () => void;
}

export const UserAccessModal: React.FC<UserAccessModalProps> = ({ isOpen, onClose, employee, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  
  // User Form State
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: UserRole.TEACHER, // Default
    assignedClass: 'Nursery',
    assignedSection: 'A'
  });
  
  const [existingUser, setExistingUser] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(true);
      // Fetch existing user data for this employee
      sheetApi.getUserForEmployee(employee.employeeId).then(res => {
        if (res.success && res.data) {
          setFormData({
            username: res.data.username,
            password: res.data.password || '', 
            role: res.data.role,
            assignedClass: res.data.assignedClass || 'Nursery',
            assignedSection: res.data.assignedSection || 'A'
          });
          setExistingUser(true);
        } else {
          // Defaults for new user
          // Try to generate a username: first letter of first name + lastname
          let generatedUsername = '';
          const names = employee.name.toLowerCase().split(' ');
          if (names.length > 1) {
             generatedUsername = names[0].charAt(0) + names[names.length - 1];
          } else {
             generatedUsername = employee.name.toLowerCase().replace(/\s/g, '');
          }
          // Remove special chars
          generatedUsername = generatedUsername.replace(/[^a-z0-9]/g, '');

          setFormData({
            username: generatedUsername || employee.employeeId.toLowerCase(),
            password: '',
            role: UserRole.TEACHER,
            assignedClass: 'Nursery',
            assignedSection: 'A'
          });
          setExistingUser(false);
        }
        setLoading(false);
      });
    }
  }, [isOpen, employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRoleSelect = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
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
            ...formData,
            employeeId: employee.employeeId,
            name: employee.name,
            // Clear class info if not Teacher
            assignedClass: formData.role === UserRole.TEACHER ? formData.assignedClass : '',
            assignedSection: formData.role === UserRole.TEACHER ? formData.assignedSection : ''
        };

        const res = await sheetApi.saveUserAccess(payload);
        if (res.success) {
            onSuccess();
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
      if (!confirm("Are you sure you want to revoke system access for this employee?")) return;
      setRemoving(true);
      try {
          const res = await sheetApi.removeUserAccess(employee.employeeId);
          if (res.success) {
              onSuccess();
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

  const RoleOption = ({ role, title, description, icon: Icon }: { role: UserRole, title: string, description: string, icon: any }) => {
      const isSelected = formData.role === role;
      return (
          <div 
            onClick={() => handleRoleSelect(role)}
            className={`relative flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${isSelected ? 'border-[#197fe6] bg-blue-50/50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-white dark:bg-slate-700'}`}
          >
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-[#197fe6]' : 'border-slate-300 dark:border-slate-500'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#197fe6]"></div>}
              </div>
              <div className="flex-1">
                  <h4 className={`text-sm font-bold ${isSelected ? 'text-[#197fe6]' : 'text-slate-900 dark:text-white'}`}>{title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{description}</p>
              </div>
              {isSelected && <Icon className="w-5 h-5 text-[#197fe6]" />}
          </div>
      );
  };

  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={existingUser ? "Edit System User" : "Add System User"} 
        icon={<KeyIcon className="w-6 h-6" />}
    >
       {loading ? (
           <div className="flex justify-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-600" /></div>
       ) : (
           <form onSubmit={handleSave} className="space-y-8">
               <div className="-mt-4 mb-6">
                   <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Create login for <span className="font-bold text-slate-900 dark:text-white">{employee.name}</span></p>
               </div>

               {error && <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold">{error}</div>}
               
               {/* Login Credentials */}
               <div className="space-y-4">
                   <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Login Credentials</h4>
                   
                   <Input 
                        label="Username"
                        name="username" 
                        value={formData.username} 
                        onChange={handleChange} 
                        required 
                        icon={<UserIcon />}
                        placeholder="e.g. jdoe"
                        className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-600 dark:text-white"
                   />
                   
                   <Input 
                       type="text" 
                       label="Password"
                       name="password" 
                       value={formData.password} 
                       onChange={handleChange} 
                       required 
                       icon={<LockIcon />}
                       placeholder="Set password"
                       className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-600 dark:text-white"
                   />
               </div>

               {/* Assign Role */}
               <div className="space-y-3">
                   <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assign Role</h4>
                   <div className="space-y-3">
                        <RoleOption 
                            role={UserRole.ADMIN} 
                            title="Admin" 
                            description="Full system access and configuration" 
                            icon={ShieldCheckIcon}
                        />
                        <RoleOption 
                            role={UserRole.MANAGEMENT} 
                            title="Management Staff" 
                            description="View reports, financial data and directory" 
                            icon={BriefcaseIcon}
                        />
                        <RoleOption 
                            role={UserRole.TEACHER} 
                            title="Class Teacher" 
                            description="Manage students, attendance and marks" 
                            icon={UserIcon}
                        />
                   </div>
               </div>

               {/* Conditional Fields for Teacher */}
               {formData.role === UserRole.TEACHER && (
                   <div className="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-2xl border border-orange-100 dark:border-orange-800/50 space-y-4 animate-in slide-in-from-top-2">
                       <div className="flex items-center gap-2 mb-2 text-orange-700 dark:text-orange-400">
                           <SchoolIcon className="w-5 h-5" />
                           <h4 className="text-xs font-bold uppercase tracking-wider">Class Assignment</h4>
                       </div>
                       
                       <div className="space-y-1.5">
                           <label className="text-xs font-bold text-orange-800/60 dark:text-orange-400/60 ml-1">Academic Year</label>
                           <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                                    <CalendarIcon className="w-5 h-5" />
                                </div>
                                <input 
                                    value="2024-2025" 
                                    readOnly 
                                    className="w-full h-12 pl-12 px-4 bg-white dark:bg-slate-700 border-none rounded-2xl text-sm font-bold text-slate-600 dark:text-slate-200 outline-none"
                                />
                           </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                               <label className="text-xs font-bold text-orange-800/60 dark:text-orange-400/60 ml-1">Class</label>
                               <select 
                                   name="assignedClass" 
                                   value={formData.assignedClass} 
                                   onChange={handleChange}
                                   className="w-full h-12 px-4 bg-white dark:bg-slate-700 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-orange-400 outline-none appearance-none"
                               >
                                   {['Playgroup', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                                       <option key={c} value={c}>{c}</option>
                                   ))}
                               </select>
                           </div>
                           <div className="space-y-1.5">
                               <label className="text-xs font-bold text-orange-800/60 dark:text-orange-400/60 ml-1">Section</label>
                               <select 
                                   name="assignedSection" 
                                   value={formData.assignedSection} 
                                   onChange={handleChange}
                                   className="w-full h-12 px-4 bg-white dark:bg-slate-700 border-none rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-orange-400 outline-none appearance-none"
                               >
                                   {['A', 'B', 'C', 'D'].map(s => (
                                       <option key={s} value={s}>{s}</option>
                                   ))}
                               </select>
                           </div>
                       </div>
                   </div>
               )}

               <div className="pt-2 flex flex-col gap-3">
                   <Button 
                        type="submit" 
                        isLoading={saving} 
                        fullWidth 
                        className="h-14 shadow-xl shadow-blue-500/20"
                    >
                       <CheckCircleIcon className="w-5 h-5 mr-2" />
                       {existingUser ? 'Update User & Assign Role' : 'Create User & Assign Role'}
                   </Button>
                   
                   {existingUser && (
                       <button
                           type="button" 
                           onClick={handleRemove}
                           disabled={removing}
                           className="text-xs font-bold text-red-500 hover:text-red-600 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                       >
                           {removing ? 'Removing...' : 'Remove User Access'}
                       </button>
                   )}
                   
                   {!existingUser && (
                        <button
                           type="button" 
                           onClick={onClose}
                           className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-2"
                        >
                           Cancel
                        </button>
                   )}
               </div>
           </form>
       )}
    </BaseModal>
  );
};