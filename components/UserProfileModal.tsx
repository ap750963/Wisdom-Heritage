
import React, { useState, useEffect } from 'react';
import { User, UserRole, ApiResponse } from '../types';
import { BaseModal } from './StudentActionModals';
import { 
    UserIcon, MailIcon, PhoneIcon, BriefcaseIcon, 
    SchoolIcon, LogOutIcon, KeyIcon, PencilIcon, 
    LoaderIcon, ShieldCheckIcon, SunIcon, MoonIcon,
    CalendarIcon, GraduationCapIcon, ChevronDownIcon
} from './Icons';
import { Button } from './Button';
import { sheetApi } from '../services/SheetApi';
import { ChangePasswordModal } from './ChangePasswordModal';
import { AcademicYearModal } from './AcademicYearModal';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onLogout: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, currentUser, onLogout, isDarkMode, onToggleTheme }) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAcademicModal, setShowAcademicModal] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  
  // Admin Config State
  const [activeYear, setActiveYear] = useState('2024-25');
  const [updatingYear, setUpdatingYear] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      Promise.all([
          sheetApi.getMyProfile(currentUser.username),
          // Fix: Explicitly type the fallback promise as ApiResponse to avoid property 'data' does not exist error
          currentUser.role === UserRole.ADMIN ? sheetApi.getSystemConfig() : Promise.resolve({ success: false } as ApiResponse)
      ]).then(([profileRes, configRes]) => {
        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else {
            setProfile(currentUser);
        }
        // Fix: configRes now correctly includes optional data property from ApiResponse type
        if (configRes.success && configRes.data) {
            setActiveYear(configRes.data.activeYear);
        }
        setLoading(false);
      });
    }
  }, [isOpen, currentUser]);

  const handleYearChange = async (newYear: string) => {
      setActiveYear(newYear);
      setUpdatingYear(true);
      try {
          await sheetApi.updateSystemConfig(newYear);
      } catch (e) {
          alert("Failed to update active year");
      } finally {
          setUpdatingYear(false);
      }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setUploadingPhoto(true);
        const file = e.target.files[0];
        try {
            const res = await sheetApi.updateProfilePhoto(currentUser.username, file);
            if (res.success && res.data) {
                setProfile(prev => prev ? { ...prev, avatarUrl: res.data!.photoUrl } : null);
            } else {
                alert("Failed to update photo.");
            }
        } catch(err) {
            alert("Error uploading photo.");
        } finally {
            setUploadingPhoto(false);
        }
    }
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

  const roleColor = {
      [UserRole.ADMIN]: 'bg-slate-800 text-white dark:bg-slate-700',
      [UserRole.TEACHER]: 'bg-blue-500 text-white',
      [UserRole.MANAGEMENT]: 'bg-purple-500 text-white',
      [UserRole.STUDENT]: 'bg-green-500 text-white',
      [UserRole.PARENT]: 'bg-orange-500 text-white'
  };

  const photoSrc = getOptimizedPhotoUrl(profile?.avatarUrl);

  const YEAR_OPTIONS = ['2023-24', '2024-25', '2025-26', '2026-27'];

  return (
    <>
        <BaseModal isOpen={isOpen} onClose={onClose} title="My Profile" icon={<UserIcon className="w-6 h-6" />}>
            {loading ? (
                <div className="flex justify-center p-12"><LoaderIcon className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : profile ? (
                <div className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <div className="relative group cursor-pointer">
                            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                {uploadingPhoto ? (
                                    <LoaderIcon className="w-8 h-8 animate-spin text-slate-400" />
                                ) : photoSrc ? (
                                    <img 
                                        src={photoSrc} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="text-4xl font-bold text-slate-300 dark:text-slate-600">{profile.name.charAt(0)}</div>
                                )}
                            </div>
                            <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                <PencilIcon className="w-6 h-6" />
                                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                            </label>
                        </div>
                        
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-4">{profile.name}</h2>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${roleColor[profile.role] || 'bg-slate-200 dark:bg-slate-700'}`}>
                            {profile.role}
                        </div>
                    </div>

                    {/* Dark Mode Toggle */}
                    {onToggleTheme && (
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-600 flex items-center justify-center text-slate-400 dark:text-slate-200 shadow-sm transition-colors">
                                    {isDarkMode ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">Dark Mode</p>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-400">{isDarkMode ? 'On' : 'Off'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={onToggleTheme} 
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${isDarkMode ? 'bg-[#197fe6]' : 'bg-slate-200 dark:bg-slate-600'}`}
                            >
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ease-in-out ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    )}

                    {/* Admin Tools Section */}
                    {profile.role === UserRole.ADMIN && (
                        <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] border border-blue-100 dark:border-blue-800">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
                                <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em]">Administrative Tools</h4>
                            </div>
                            
                            <div className="space-y-4">
                                {/* Academic Year Selector */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-blue-100/50 dark:border-blue-900/50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-500">
                                                <CalendarIcon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">Active Session</p>
                                                <p className="text-[10px] font-medium text-slate-500">Global display year</p>
                                            </div>
                                        </div>
                                        
                                        <div className="relative">
                                            <select 
                                                value={activeYear} 
                                                onChange={(e) => handleYearChange(e.target.value)}
                                                className="pl-3 pr-8 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none appearance-none cursor-pointer focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                {YEAR_OPTIONS.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                            <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                            {updatingYear && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setShowAcademicModal(true)}
                                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-blue-100/50 dark:border-blue-900/50 hover:border-blue-300 dark:hover:border-blue-700 transition-all active:scale-[0.98] group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/40 flex items-center justify-center text-orange-500">
                                            <GraduationCapIcon className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white">New Academic Year</p>
                                            <p className="text-[10px] font-medium text-slate-500">Backup & Reset Database</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                        <ChevronDownIcon className="w-4 h-4 -rotate-90" />
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Details List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 shadow-sm">
                                <UserIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Username</p>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{profile.username}</p>
                            </div>
                        </div>

                        {profile.employeeId && (
                            <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 shadow-sm">
                                    <BriefcaseIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase">Employee ID</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{profile.employeeId}</p>
                                </div>
                            </div>
                        )}

                        {profile.role === UserRole.TEACHER && (
                            <div className="flex items-center gap-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30">
                                <div className="w-10 h-10 rounded-full bg-white dark:bg-blue-900/50 flex items-center justify-center text-blue-500 dark:text-blue-400 shadow-sm">
                                    <SchoolIcon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-blue-400 uppercase">Assigned Class</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Class {profile.assignedClass} - {profile.assignedSection}</p>
                                </div>
                            </div>
                        )}

                        {(profile.phone || profile.email) && (
                            <div className="grid grid-cols-2 gap-4">
                                {profile.phone && (
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Phone</p>
                                        <div className="flex items-center gap-2">
                                            <PhoneIcon className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{profile.phone}</span>
                                        </div>
                                    </div>
                                )}
                                {profile.email && (
                                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-1">Email</p>
                                        <div className="flex items-center gap-2">
                                            <MailIcon className="w-3 text-slate-400 dark:text-slate-500" />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">{profile.email}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="space-y-3 pt-2">
                        <Button 
                            fullWidth 
                            variant="secondary" 
                            className="h-12"
                            onClick={() => setShowPasswordModal(true)}
                        >
                            <KeyIcon className="w-4 h-4 mr-2" />
                            Update Password
                        </Button>
                        <Button 
                            fullWidth 
                            variant="danger" 
                            className="h-12 bg-red-50 hover:bg-red-100 text-red-600 border-transparent shadow-none dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-400"
                            onClick={onLogout}
                        >
                            <LogOutIcon className="w-4 h-4 mr-2" />
                            Log Out
                        </Button>
                    </div>
                </div>
            ) : null}
        </BaseModal>

        <ChangePasswordModal 
            isOpen={showPasswordModal}
            onClose={() => setShowPasswordModal(false)}
            username={currentUser.username}
        />

        <AcademicYearModal 
            isOpen={showAcademicModal}
            onClose={() => setShowAcademicModal(false)}
            currentUser={currentUser}
        />
    </>
  );
};
