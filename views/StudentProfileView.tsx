
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ArrowLeftIcon, PhoneIcon, SchoolIcon, LoaderIcon, BanknoteIcon, PencilIcon, 
  MailIcon, UserIcon, CheckCircleIcon, ChevronDownIcon, MapPinIcon, KeyIcon
} from '../components/Icons';
import { Student, User, UserRole } from '../types';
import { sheetApi } from '../services/SheetApi';
import { CollectFeesModal } from '../components/CollectFeesModal';
import { 
  ResultsModal, 
  AttendanceModal, 
  EditStudentModal 
} from '../components/StudentActionModals';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { StudentUserAccessModal } from '../components/StudentUserAccessModal';

interface StudentProfileViewProps {
  studentId: string;
  initialData?: Student;
  onBack: () => void;
  isReadOnly?: boolean;
  currentUser: User | null;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({ studentId, initialData, onBack, isReadOnly = false, currentUser }) => {
  const [student, setStudent] = useState<Student | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [attendancePercent, setAttendancePercent] = useState<number | null>(null);
  const [averageGrade, setAverageGrade] = useState<string>('-');
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState('');
  
  // Modal States
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);

  const isTeacher = currentUser?.role === UserRole.TEACHER;
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isManagement = currentUser?.role === UserRole.MANAGEMENT;
  const canEdit = isAdmin || isManagement;
  const canManageAccess = isAdmin || isManagement || isTeacher;

  const fetchDetails = useCallback(async () => {
    if (!studentId) return;
    try {
      setLoading(true);
      setError('');
      
      const response = await sheetApi.getStudentDetails(studentId, currentUser);
      if (response.success && response.data) {
          setStudent(response.data);
      } else {
          setError(response.message || 'Failed to load student.');
          setLoading(false);
          return;
      }
      
      const [attRes, resRes] = await Promise.all([
          sheetApi.getStudentAttendance(studentId),
          sheetApi.getStudentResults(studentId)
      ]);

      if (attRes.success && attRes.data) {
          setAttendancePercent(attRes.data.percentage);
      }

      if (resRes.success && resRes.data && resRes.data.length > 0) {
          let totalObtained = 0;
          let totalMax = 0;
          resRes.data.forEach(exam => {
              exam.subjects.forEach(sub => {
                  totalObtained += sub.marks;
                  totalMax += sub.maxMarks;
              });
          });
          if (totalMax > 0) {
              const pct = Math.round((totalObtained / totalMax) * 100);
              setAverageGrade(`${pct}%`);
          }
      }
      
    } catch (e) {
      console.error("Failed to load student details");
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [studentId, currentUser]);

  useEffect(() => {
    if (!initialData) {
        fetchDetails();
    } else {
        const loadStats = async () => {
             try {
                 const [attRes, resRes] = await Promise.all([
                     sheetApi.getStudentAttendance(studentId),
                     sheetApi.getStudentResults(studentId)
                 ]);
                 if (attRes.success && attRes.data) setAttendancePercent(attRes.data.percentage);
                 if (resRes.success && resRes.data && resRes.data.length > 0) {
                    let totalObtained = 0, totalMax = 0;
                    resRes.data.forEach(exam => {
                        exam.subjects.forEach(sub => {
                            totalObtained += sub.marks;
                            totalMax += sub.maxMarks;
                        });
                    });
                    if (totalMax > 0) setAverageGrade(`${Math.round((totalObtained / totalMax) * 100)}%`);
                 }
             } catch (e) { console.error("Error loading profile stats", e); }
        }
        loadStats();
    }
  }, [studentId, initialData, fetchDetails]);

  const handleArchiveConfirm = async () => {
    if (!student) return;
    setIsArchiving(true);
    try {
      const deletedBy = currentUser?.name || currentUser?.username || 'Admin';
      const res = await sheetApi.archiveStudent(student.admissionNo, deletedBy);
      if (res.success) onBack();
      else alert("Archive failed: " + res.message);
    } catch(e) { alert("An error occurred while archiving."); }
    finally { setIsArchiving(false); setShowArchiveModal(false); }
  };

  const defaultImage = `https://ui-avatars.com/api/?background=random&name=${student?.name || 'Student'}`;
  const photoSrc = student?.photoUrl ? (student.photoUrl.includes('id=') ? `https://drive.google.com/thumbnail?id=${student.photoUrl.match(/id=([^&]+)/)?.[1]}&sz=w1000` : student.photoUrl) : defaultImage;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const InfoRow = ({ label, value, isLast }: { label: string, value: string, isLast?: boolean }) => (
      <div className={`flex justify-between items-center py-3 ${!isLast ? 'border-b border-slate-50 dark:border-zinc-800' : ''}`}>
          <span className="text-slate-400 dark:text-zinc-600 text-xs font-bold uppercase tracking-wider">{label}</span>
          <span className="text-slate-700 dark:text-zinc-200 text-sm font-bold text-right truncate select-all ml-4">{value || '-'}</span>
      </div>
  );

  const ActionButton = ({ icon: Icon, label, color, onClick, href }: any) => {
      const Wrapper = href ? 'a' : 'button';
      return (
        //@ts-ignore
        <Wrapper href={href} onClick={onClick} className="flex flex-col items-center gap-2 group active:scale-95 transition-transform w-full min-w-0">
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-[1.2rem] ${color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-all text-white shrink-0 mx-auto`}>
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-zinc-500 group-hover:text-slate-900 dark:group-hover:text-white text-center leading-tight truncate w-full">{label}</span>
        </Wrapper>
      );
  };

  const ProfileSection = ({ title, icon: Icon, bgColor, iconColor, children }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft overflow-hidden border dark:border-zinc-800">
         <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-6 active:bg-slate-50 dark:active:bg-zinc-800/50 transition-colors">
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${bgColor} dark:bg-zinc-950/50 ${iconColor}`}>
                    <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-zinc-100">{title}</h3>
            </div>
            <ChevronDownIcon className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
         </button>
         <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
            <div className="overflow-hidden"><div className="px-6 pb-6 pt-0">{children}</div></div>
         </div>
      </div>
    );
  };

  return (
    <div className="bg-[#f2f6fc] dark:bg-black min-h-screen pb-32 relative transition-colors duration-200">
        <div className="h-72 bg-gradient-to-br from-[#197fe6] to-[#4facfe] dark:from-blue-600 dark:to-blue-800 rounded-b-[3rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute top-0 left-0 right-0 px-6 py-6 flex justify-between items-center z-20">
                <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white active:scale-90 transition-all"><ArrowLeftIcon className="w-5 h-5" /></button>
                <div className="text-white font-black tracking-widest text-[10px] opacity-80 uppercase">Student Profile</div>
                <div className="w-10" />
            </div>
        </div>

        <div className="px-6 -mt-40 relative z-10 max-w-lg mx-auto flex flex-col gap-6">
            {!student && loading ? (
               <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-12 flex flex-col items-center animate-in fade-in duration-500 border dark:border-zinc-800">
                  <LoaderIcon className="w-10 h-10 animate-spin text-[#197fe6]" />
               </div>
            ) : student ? (
               <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col gap-6">
                  <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-6 flex flex-col items-center text-center border dark:border-zinc-800">
                      <div className="-mt-16 mb-4 relative">
                          <img src={photoSrc} alt={student.name} className="w-28 h-28 rounded-[2rem] object-cover border-[6px] border-[#f2f6fc] dark:border-black shadow-xl" referrerPolicy="no-referrer" onError={(e) => (e.target as HTMLImageElement).src = defaultImage} />
                          <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-[4px] border-white dark:border-zinc-900 flex items-center justify-center ${student.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}><CheckCircleIcon className="w-4 h-4 text-white" /></div>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-100 leading-tight mb-1">{student.name}</h2>
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-zinc-950 text-slate-600 dark:text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">
                          {student.class ? `Class ${student.class} - ${student.section}` : 'Unassigned'}
                      </span>
                      
                      <div className="flex items-center gap-2 mb-6">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest">Roll No: {student.rollNo || 'Not Set'}</p>
                          {(!isReadOnly || isTeacher || isManagement) && (
                              <button onClick={() => setShowEditModal(true)} className="p-1 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-400 hover:text-[#197fe6] transition-colors border border-slate-100 dark:border-zinc-800"><PencilIcon className="w-3 h-3" /></button>
                          )}
                      </div>

                      <div className="grid grid-cols-2 gap-4 w-full">
                          <button onClick={() => setShowAttendanceModal(true)} className="bg-blue-50/50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-blue-100 dark:border-zinc-800 text-left active:scale-95 transition-all">
                               <p className="text-[10px] font-bold text-blue-400 dark:text-blue-500 uppercase tracking-wider mb-1">Attendance</p>
                               <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attendancePercent || '-'}</span><span className="text-xs text-blue-400 font-bold">%</span></div>
                          </button>
                          <button onClick={() => setShowResultsModal(true)} className="bg-purple-50/50 dark:bg-zinc-950/50 rounded-2xl p-3 border border-purple-100 dark:border-zinc-800 text-left active:scale-95 transition-all">
                               <p className="text-[10px] font-bold text-purple-400 dark:text-purple-500 uppercase tracking-wider mb-1">Grade</p>
                               <div className="flex items-baseline gap-1"><span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{averageGrade}</span></div>
                          </button>
                      </div>
                  </div>

                  <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-6 border dark:border-zinc-800 transition-colors">
                      <h3 className="text-xs font-bold text-slate-400 dark:text-zinc-600 uppercase tracking-widest mb-4 ml-1">Quick Actions</h3>
                      <div className="grid grid-cols-3 gap-y-4 gap-x-2">
                          <ActionButton icon={PhoneIcon} label="Call" color="bg-blue-500" href={`tel:${student.phone1}`} />
                          <ActionButton icon={MailIcon} label="Message" color="bg-violet-500" href={`sms:${student.phone1}`} />
                          {canManageAccess && <ActionButton icon={KeyIcon} label="Account" color="bg-slate-700" onClick={() => setShowAccessModal(true)} />}
                          {(isAdmin || isManagement) && (
                              <button onClick={() => setShowFeesModal(true)} className="col-span-3 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.2rem] flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"><BanknoteIcon className="w-5 h-5" /><span className="font-bold text-xs uppercase tracking-wider">Collect Fees</span></button>
                          )}
                      </div>
                  </div>

                  <ProfileSection title="Personal Information" icon={UserIcon} bgColor="bg-blue-50" iconColor="text-[#197fe6]">
                      <InfoRow label="Father's Name" value={student.fatherName} /><InfoRow label="Mother's Name" value={student.motherName} /><InfoRow label="Birthday" value={formatDate(student.dob)} /><InfoRow label="Aadhaar No." value={student.aadhaar} /><InfoRow label="Samagra ID" value={student.samagraId} isLast />
                  </ProfileSection>

                  <ProfileSection title="Academic Info" icon={SchoolIcon} bgColor="bg-purple-50" iconColor="text-purple-600">
                      <InfoRow label="Roll No" value={student.rollNo || '-'} /><InfoRow label="Admission No" value={student.admissionNo} /><InfoRow label="Joining Date" value={formatDate(student.joiningDate)} />{!isTeacher && <InfoRow label="Total Fee" value={`₹ ${(student.totalFees || 0).toLocaleString()}`} />}<InfoRow label="Status" value={student.status} isLast />
                  </ProfileSection>

                  <ProfileSection title="Contact Information" icon={PhoneIcon} bgColor="bg-emerald-50" iconColor="text-emerald-600">
                      <InfoRow label="Primary Phone" value={student.phone1} /><InfoRow label="Secondary Phone" value={student.phone2} /><InfoRow label="Home Address" value={student.address} isLast />
                  </ProfileSection>

                  {isAdmin && <div className="pt-2"><button onClick={() => setShowArchiveModal(true)} className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-95 transition-colors">Move to Archive</button></div>}
               </div>
            ) : (
               <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-12 text-center border dark:border-zinc-800">
                  <p className="text-slate-400 dark:text-zinc-600 font-bold">{error || 'Student not found.'}</p>
                  <button onClick={onBack} className="mt-4 px-6 py-2 bg-[#197fe6] text-white rounded-xl font-bold">Go Back</button>
               </div>
            )}
        </div>

      {student && <CollectFeesModal isOpen={showFeesModal} onClose={() => setShowFeesModal(false)} student={student} onSuccess={fetchDetails} />}
      {student && <ResultsModal isOpen={showResultsModal} onClose={() => setShowResultsModal(false)} student={student} />}
      {student && <AttendanceModal isOpen={showAttendanceModal} onClose={() => setShowAttendanceModal(false)} student={student} />}
      {student && <EditStudentModal isOpen={showEditModal} onClose={() => setShowEditModal(false)} student={student} onSuccess={fetchDetails} restricted={isTeacher} />}
      <ConfirmationModal isOpen={showArchiveModal} onClose={() => setShowArchiveModal(false)} onConfirm={handleArchiveConfirm} title="Move to Archive" message="Are you sure you want to proceed? This will move the record to archive." confirmLabel="Confirm Archive" isLoading={isArchiving} />
      {student && <StudentUserAccessModal isOpen={showAccessModal} onClose={() => setShowAccessModal(false)} student={student} />}
    </div>
  );
};
