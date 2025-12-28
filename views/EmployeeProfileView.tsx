import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, PhoneIcon, MapPinIcon, CalendarIcon, 
  LoaderIcon, PencilIcon, MailIcon, UserIcon, 
  BriefcaseIcon,
  IdCardIcon,
  ShieldCheckIcon,
  AwardIcon,
  GraduationCapIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  KeyIcon
} from '../components/Icons';
import { Employee, User, UserRole } from '../types';
import { sheetApi } from '../services/SheetApi';
import { EmployeeModal, EmployeeAttendanceModal } from '../components/EmployeeActionModals';
import { UserAccessModal } from '../components/UserAccessModal';
import { ConfirmationModal } from '../components/ConfirmationModal';

interface EmployeeProfileViewProps {
  employeeId: string;
  onBack: () => void;
  currentUser: User | null;
}

export const EmployeeProfileView: React.FC<EmployeeProfileViewProps> = ({ employeeId, onBack, currentUser }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = currentUser?.role === UserRole.ADMIN;

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await sheetApi.getEmployeeDetails(employeeId);
      if (response.success && response.data) {
          setEmployee(response.data);
      }
      
      const attRes = await sheetApi.getEmployeeAttendance(employeeId);
      if (attRes.success && attRes.data) {
          setAttendancePercent(attRes.data.percentage);
      }
    } catch (e) {
      console.error("Failed to load employee details");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
        const deletedBy = currentUser?.name || currentUser?.username || 'Admin';
        const res = await sheetApi.deleteEmployee(employeeId, deletedBy);
        if (res.success) {
           onBack();
        } else {
           alert("Delete failed: " + res.message);
        }
    } catch (e) {
        console.error(e);
        alert("An error occurred during deletion.");
    } finally {
        setDeleting(false);
        setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f2f6fc] dark:bg-black transition-colors">
        <LoaderIcon className="w-8 h-8 animate-spin text-purple-600 mb-3" />
        <p className="text-slate-400 dark:text-zinc-600 text-sm font-bold tracking-wide">LOADING PROFILE...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-[#f2f6fc] dark:bg-black transition-colors">
        <p className="text-slate-400 dark:text-zinc-600 font-bold">Employee not found.</p>
        <button onClick={onBack} className="mt-4 px-6 py-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm font-bold text-slate-700 dark:text-zinc-300">Go Back</button>
      </div>
    );
  }

  const InfoRow: React.FC<{ label: string, value: string, isLast?: boolean }> = ({ label, value, isLast }) => (
      <div className={`flex justify-between items-center py-3 ${!isLast ? 'border-b border-slate-50 dark:border-zinc-800' : ''}`}>
          <span className="text-slate-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-wider">{label}</span>
          <span className="text-slate-700 dark:text-zinc-200 text-sm font-bold text-right max-w-[60%] truncate select-all">{value || '-'}</span>
      </div>
  );

  const ActionButton: React.FC<{ icon: any, label: string, color: string, onClick?: () => void, href?: string }> = ({ icon: Icon, label, color, onClick, href }) => {
      const Wrapper = href ? 'a' : 'button';
      return (
        // @ts-ignore
        <Wrapper 
            href={href} 
            onClick={onClick}
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
        >
            <div className={`w-14 h-14 rounded-[1.2rem] ${color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all text-white`}>
                <Icon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{label}</span>
        </Wrapper>
      );
  };

  const ProfileSection: React.FC<{ 
    title: string; 
    icon: any; 
    bgColor: string; 
    iconColor: string;
    children: React.ReactNode;
    defaultOpen?: boolean; 
  }> = ({ title, icon: Icon, bgColor, iconColor, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const darkBg = 'dark:bg-zinc-950/50';

    return (
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft overflow-hidden transition-all hover:shadow-md border dark:border-zinc-800">
         <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between p-6 cursor-pointer select-none active:bg-slate-50 dark:active:bg-zinc-800/50 transition-colors"
         >
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} ${darkBg} ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100">{title}</h3>
            </div>
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-slate-400 dark:text-zinc-600`}>
                <ChevronDownIcon className="w-5 h-5" />
            </div>
         </button>
         
         <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden">
                <div className="px-6 pb-6 pt-0 pl-3">
                   {children}
                </div>
            </div>
         </div>
      </div>
    );
  };

  const formatDate = (dateString?: string) => {
      if (!dateString) return '-';
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
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

  const photoSrc = getOptimizedPhotoUrl(employee.photoUrl);

  return (
    <div className="bg-[#f2f6fc] dark:bg-black min-h-screen font-sans pb-32 relative transition-colors duration-200">
        <div className="h-72 bg-gradient-to-br from-purple-600 to-purple-400 dark:from-purple-700 dark:to-purple-900 rounded-b-[3rem] relative z-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4"></div>

            <div className="absolute top-0 left-0 right-0 px-6 py-6 flex justify-between items-center z-20">
                 <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div className="text-white font-bold tracking-wide text-sm opacity-90 uppercase">Staff Profile</div>
                {isAdmin ? (
                    <button onClick={() => setShowEditModal(true)} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                        <PencilIcon className="w-4 h-4" />
                    </button>
                ) : <div className="w-10" />}
            </div>
        </div>

        <div className="px-6 -mt-40 relative z-10 max-w-lg mx-auto flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-6 flex flex-col items-center text-center relative transition-colors duration-200 border dark:border-zinc-800">
                <div className="-mt-16 mb-4 relative">
                    {photoSrc ? (
                        <img 
                            src={photoSrc} 
                            alt={employee.name} 
                            className="w-28 h-28 rounded-[2rem] object-cover border-[6px] border-[#f2f6fc] dark:border-black shadow-xl bg-white dark:bg-zinc-950 transition-colors duration-200"
                            referrerPolicy="no-referrer"
                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                    ) : (
                        <div className="w-28 h-28 rounded-[2rem] bg-indigo-50 dark:bg-zinc-950/50 border-[6px] border-[#f2f6fc] dark:border-black shadow-xl flex items-center justify-center text-4xl font-bold text-indigo-500 dark:text-indigo-400 transition-colors duration-200">
                            {employee.name.charAt(0)}
                        </div>
                    )}
                     <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-[4px] border-white dark:border-zinc-900 flex items-center justify-center bg-purple-500 transition-colors duration-200">
                        <CheckCircleIcon className="w-4 h-4 text-white" />
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 leading-tight mb-1">{employee.name}</h2>
                <div className="flex flex-col items-center gap-2 mb-6">
                     <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider">
                        {employee.post}
                     </span>
                     <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">ID: {employee.employeeId}</span>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full mb-2">
                    <div className="bg-blue-50/50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-blue-100/50 dark:border-zinc-800">
                         <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-1">Experience</p>
                         <div className="flex items-baseline justify-center gap-1">
                             <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{employee.experience || '0'}</span>
                             <span className="text-xs text-blue-400 dark:text-blue-500 font-bold">Years</span>
                         </div>
                    </div>

                    <button 
                        onClick={() => setShowAttendanceModal(true)}
                        className="bg-purple-50/50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-purple-100/50 dark:border-zinc-800 text-left hover:bg-purple-100/50 dark:hover:bg-zinc-800/50 transition-all active:scale-95 group relative"
                    >
                         <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronDownIcon className="w-3 h-3 -rotate-90 text-purple-400 dark:text-purple-500" />
                         </div>
                         <p className="text-[10px] font-bold text-purple-400 dark:text-purple-500 uppercase tracking-wider mb-1">Attendance</p>
                         <div className="flex items-baseline gap-1">
                             <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{attendancePercent !== null ? attendancePercent : '-'}</span>
                             <span className="text-xs text-purple-400 dark:text-purple-500 font-bold">%</span>
                         </div>
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-6 transition-colors duration-200 border dark:border-zinc-800">
                <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-4 ml-1">Quick Actions</h3>
                <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                    <ActionButton icon={PhoneIcon} label="Call" color="bg-blue-500" href={`tel:${employee.phone1}`} />
                    <ActionButton icon={MailIcon} label="Message" color="bg-violet-500" href={`sms:${employee.phone1}`} />
                    {isAdmin && (
                        <ActionButton icon={KeyIcon} label="Access" color="bg-slate-700" onClick={() => setShowAccessModal(true)} />
                    )}
                </div>
            </div>

            <ProfileSection 
                title="Personal Information" 
                icon={UserIcon} 
                bgColor="bg-violet-50" 
                iconColor="text-violet-600"
                defaultOpen={false}
            >
                <div className="pl-2">
                    <InfoRow label="Father's Name" value={employee.fatherName} />
                    <InfoRow label="Mother's Name" value={employee.motherName} />
                    <InfoRow label="Birthday" value={formatDate(employee.dob)} />
                    <InfoRow label="Gender" value={employee.gender || '-'} isLast />
                </div>
            </ProfileSection>

            <ProfileSection 
                title="Professional Details" 
                icon={BriefcaseIcon} 
                bgColor="bg-purple-50" 
                iconColor="text-purple-600"
                defaultOpen={false}
            >
                <div className="pl-2">
                    <InfoRow label="Qualification" value={employee.qualification} />
                    <InfoRow label="Experience" value={`${employee.experience} Years`} />
                    <InfoRow label="Joining Date" value={formatDate(employee.joiningDate)} />
                    <InfoRow label="Monthly Salary" value={`₹ ${(employee.salary || 0).toLocaleString()}`} isLast />
                </div>
            </ProfileSection>

            <ProfileSection 
                title="Contact Details" 
                icon={MapPinIcon} 
                bgColor="bg-slate-100" 
                iconColor="text-slate-600"
                defaultOpen={false}
            >
                <div className="pl-2">
                    <InfoRow label="Primary Phone" value={employee.phone1} />
                    <InfoRow label="Secondary Phone" value={employee.phone2} />
                    <InfoRow label="Email" value={employee.email} />
                    <InfoRow label="Address" value={employee.address} isLast />
                </div>
            </ProfileSection>

            <ProfileSection 
                title="Legal & Banking" 
                icon={IdCardIcon} 
                bgColor="bg-indigo-50" 
                iconColor="text-indigo-600"
                defaultOpen={false}
            >
                <div className="pl-2">
                    <InfoRow label="Aadhaar No." value={employee.aadhaar} />
                    <InfoRow label="PAN No." value={employee.pan} />
                    <InfoRow label="Bank Account" value={employee.bankAccount} />
                    <InfoRow label="IFSC Code" value={employee.ifsc} isLast />
                </div>
            </ProfileSection>

            {isAdmin && (
                <div className="pt-2">
                     <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 active:scale-95"
                    >
                        Delete Employee Record
                    </button>
                </div>
            )}
        </div>

      <EmployeeModal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)} 
        onSuccess={fetchDetails}
        employeeToEdit={employee}
      />
      
      <ConfirmationModal 
        isOpen={showDeleteModal} 
        onClose={() => setShowDeleteModal(false)} 
        onConfirm={handleDeleteConfirm} 
        title="Delete Employee" 
        message="Are you sure you want to proceed? This action will move the record to deleted records and remove it from the staff directory."
        confirmLabel="Confirm Delete"
        isLoading={deleting}
      />
      
      <EmployeeAttendanceModal 
        isOpen={showAttendanceModal} 
        onClose={() => setShowAttendanceModal(false)} 
        employee={employee}
      />

      <UserAccessModal 
        isOpen={showAccessModal} 
        onClose={() => setShowAccessModal(false)} 
        employee={employee}
        onSuccess={() => {}} // No refresh needed for profile details
      />
    </div>
  );
};