
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  CalendarIcon, 
  SearchIcon, 
  LoaderIcon,
  CheckCircleIcon,
  PlusIcon,
  TrashIcon,
  DownloadIcon,
  LockIcon,
  BellIcon,
  MailIcon
} from '../components/Icons';
import { Student, User } from '../types';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from '../components/StudentActionModals';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { StudentProfileView } from './StudentProfileView';
import { DateNavigator } from '../components/DateNavigator';

interface TeacherAttendanceViewProps {
  currentUser: User | null;
  onBack: () => void;
}

export const TeacherAttendanceView: React.FC<TeacherAttendanceViewProps> = ({ currentUser, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<Record<string, 'Present' | 'Absent'>>({});
  const [rollNumbers, setRollNumbers] = useState<Record<string, string>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [notified, setNotified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const [teacherHolidays, setTeacherHolidays] = useState<{date: string, description: string}[]>([]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayDescription, setHolidayDescription] = useState('');
  const [processingHoliday, setProcessingHoliday] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const fetchAttendanceData = async () => {
    if (!currentUser?.assignedClass || !currentUser?.assignedSection) return;
    setLoading(true);
    try {
      const res = await sheetApi.getAttendanceData({
          class: currentUser.assignedClass,
          section: currentUser.assignedSection,
          date: selectedDate,
          role: currentUser.role,
          assignedClass: currentUser.assignedClass,
          assignedSection: currentUser.assignedSection
      });

      if (res.success && res.data) {
        const fetchedStudents = res.data.students;
        setStudents(fetchedStudents);
        setIsLocked(res.data.isLocked || false);
        setNotified(res.data.notified || false);
        const newAttendance: Record<string, 'Present' | 'Absent'> = {};
        const newRolls: Record<string, string> = {};
        fetchedStudents.forEach((s: any) => {
            if (s.status === 'Present' || s.status === 'Absent') newAttendance[s.admissionNo] = s.status;
            if (s.rollNo) newRolls[s.admissionNo] = s.rollNo;
        });
        setAttendance(newAttendance);
        setRollNumbers(newRolls);
      } else {
        setStudents([]);
      }
      if (currentUser?.employeeId) {
          const holRes = await sheetApi.getTeacherHolidays(currentUser.employeeId);
          if (holRes.success && holRes.data) setTeacherHolidays(holRes.data);
      }
    } catch (e) {
      console.error(e);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAttendanceData(); }, [selectedDate, currentUser]);

  const toggleAttendance = (studentId: string, status: 'Present' | 'Absent') => {
      if (isLocked) return;
      setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAllPresent = () => {
      if (isLocked) return;
      const newAttendance = { ...attendance };
      students.forEach(s => { if (!newAttendance[s.admissionNo]) newAttendance[s.admissionNo] = 'Present'; });
      setAttendance(newAttendance);
  };

  const handleSubmit = async () => {
      if (Object.keys(attendance).length === 0) return alert("No attendance marked.");
      setSubmitting(true);
      try {
          const attendanceList = Object.entries(attendance).map(([admNo, status]) => {
              const stud = students.find(s => s.admissionNo === admNo);
              return { admissionNo: admNo, name: stud ? stud.name : 'Unknown', status: status as 'Present' | 'Absent', rollNo: rollNumbers[admNo] || '', photoUrl: stud ? stud.photoUrl : '' };
          });
          const res = await sheetApi.markClassAttendance(currentUser?.assignedClass || 'Unassigned', currentUser?.assignedSection || 'A', selectedDate, attendanceList);
          if (res.success) { setIsLocked(true); alert("Attendance submitted successfully."); }
          else alert(String(res.message || "Failed to submit attendance."));
      } catch (e) { alert("An unexpected error occurred during submission."); }
      finally { setSubmitting(false); }
  };

  const handleNotify = async () => {
      if (!isLocked) return;
      setNotifying(true);
      try {
          const res = await sheetApi.request<any>('notifyAbsentees', { class: currentUser?.assignedClass, section: currentUser?.assignedSection, date: selectedDate });
          if (res.success) { setNotified(true); alert(String(res.message || "Notifications sent.")); }
          else alert(String(res.message || "Notification failed."));
      } catch (e) { alert("Failed to trigger notifications."); }
      finally { setNotifying(false); }
  };

  // Add handleHolidayAction to fix the error where it was missing in the JSX
  const handleHolidayAction = async () => {
      if (!currentUser?.employeeId) return;
      setProcessingHoliday(true);
      try {
          if (teacherHoliday) {
              const res = await sheetApi.removeTeacherHoliday(currentUser.employeeId, selectedDate);
              if (res.success) {
                  await fetchAttendanceData();
                  setShowHolidayModal(false);
              } else {
                  alert(res.message || "Failed to remove leave.");
              }
          } else {
              const res = await sheetApi.setTeacherHoliday(
                  currentUser.employeeId, 
                  selectedDate, 
                  holidayDescription, 
                  currentUser.name || currentUser.username
              );
              if (res.success) {
                  await fetchAttendanceData();
                  setShowHolidayModal(false);
                  setHolidayDescription('');
              } else {
                  alert(res.message || "Failed to set leave.");
              }
          }
      } catch (e) {
          alert("An error occurred processing leave.");
      } finally {
          setProcessingHoliday(false);
      }
  };

  const filteredStudents = students.filter(s => {
    const roll = rollNumbers[s.admissionNo] || '';
    return s.name.toLowerCase().includes(searchQuery.toLowerCase()) || roll.includes(searchQuery);
  }).sort((a, b) => (parseInt(rollNumbers[a.admissionNo]) || 9999) - (parseInt(rollNumbers[b.admissionNo]) || 9999));

  const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'Absent').length;
  const percentage = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const selectedDateObj = new Date(selectedDate);
  const isSunday = selectedDateObj.getDay() === 0;
  const dateLocale = selectedDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const teacherHoliday = teacherHolidays.find(h => {
      const hDate = new Date(h.date).toISOString().split('T')[0];
      return hDate === selectedDate;
  });
  const isHoliday = isSunday || !!teacherHoliday;

  const getOptimizedPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('id=')) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }
    return url;
  };

  if (selectedStudentId) return <StudentProfileView studentId={selectedStudentId} onBack={() => { setSelectedStudentId(null); fetchAttendanceData(); }} currentUser={currentUser} />;

  return (
    <div className="flex flex-col h-full bg-black font-sans transition-colors duration-200">
        <div className="bg-emerald-600 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
            <div className="flex items-center justify-between text-white mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <h2 className="text-xl font-bold tracking-wide">Attendance</h2>
                </div>
                <button onClick={() => setShowExportModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all text-white"><DownloadIcon className="w-4 h-4" /><span>Export</span></button>
            </div>
            <div className="flex items-center gap-3">
                <DateNavigator value={selectedDate} onChange={setSelectedDate} variant="emerald" className="flex-1 h-[50px]" />
                {!isSunday && (
                    <button onClick={() => { setHolidayDescription(teacherHoliday?.description || ''); setShowHolidayModal(true); }} disabled={!currentUser?.employeeId} className={`h-[50px] w-[50px] rounded-[1.5rem] shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center gap-1 leading-none shrink-0 border border-white/10 ${teacherHoliday ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-white text-emerald-600 hover:bg-emerald-50'}`}>
                        {teacherHoliday ? <TrashIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                        <span className="text-[6px] font-black uppercase text-center leading-tight">{teacherHoliday ? 'Remove\nLeave' : 'Mark\nLeave'}</span>
                    </button>
                )}
                {isSunday && <div className="h-[50px] w-[50px] bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-[1.5rem] flex flex-col items-center justify-center gap-1 leading-none opacity-80 cursor-not-allowed shrink-0"><CheckCircleIcon className="w-5 h-5" /><span className="text-[9px] font-bold uppercase text-center">Off</span></div>}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 space-y-6 relative z-10">
            {loading && students.length === 0 ? (
                <div className="flex justify-center py-20 animate-in fade-in duration-700">
                    <LoaderIcon className="w-8 h-8 animate-spin text-emerald-500/40" />
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                    {!isHoliday && (
                        <div className="flex gap-3">
                            <div className="flex-1 bg-zinc-900 p-4 rounded-2xl shadow-sm border-none"><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Present</p><p className="text-xl font-bold text-emerald-600">{presentCount}<span className="text-zinc-800 text-sm font-medium">/{students.length}</span></p></div>
                            <div className="flex-1 bg-zinc-900 p-4 rounded-2xl shadow-sm border-none"><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Absent</p><p className="text-xl font-bold text-rose-600">{absentCount}</p></div>
                            <div className="flex-1 bg-zinc-900 p-4 rounded-2xl shadow-sm border-none"><p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Percent</p><p className="text-xl font-bold text-emerald-600">{percentage}%</p></div>
                        </div>
                    )}
                    {isLocked && absentCount > 0 && (
                        <div className="bg-zinc-900/50 border-none rounded-3xl p-5 shadow-sm border border-zinc-800">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0 border border-zinc-700"><BellIcon className="w-6 h-6" /></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-base">Absence Notifications</h4>
                                    <p className="text-zinc-400 text-xs mt-1 leading-relaxed">{absentCount} students are missing today. Notify parents?</p>
                                    <div className="flex gap-2 mt-4">
                                        {notified ? <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs uppercase tracking-wider bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-900/50"><CheckCircleIcon className="w-4 h-4" />Sent</div> : <button onClick={handleNotify} disabled={notifying} className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 h-10 rounded-xl font-bold text-xs shadow-lg active:scale-95 disabled:opacity-50">{notifying ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <MailIcon className="w-4 h-4" />}Notify Parents</button>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {!isHoliday ? (
                        <>
                            <div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-zinc-700" /></div><input className="block w-full pl-11 pr-4 h-14 border-none rounded-2xl bg-zinc-900 text-white shadow-sm font-medium focus:ring-2 focus:ring-emerald-500/20 transition-all" placeholder="Search name or roll no..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
                            <div className="flex items-center justify-between px-1"><h3 className="text-lg font-bold text-white">Class {currentUser?.assignedClass || 'Students'}</h3>{!isLocked && <button onClick={markAllPresent} className="text-xs font-bold text-emerald-600 hover:bg-emerald-900/10 px-3 py-1.5 rounded-lg transition-colors">Mark all Present</button>}{isLocked && <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 rounded-lg text-zinc-500 text-xs font-bold uppercase tracking-wider"><LockIcon className="w-3 h-3" /> Locked</div>}</div>
                            <div className="space-y-3 pb-32">
                                {filteredStudents.length > 0 ? filteredStudents.map(student => {
                                    const status = attendance[student.admissionNo], isPresent = status === 'Present', isAbsent = status === 'Absent';
                                    return (
                                        <div key={student.admissionNo} onClick={() => setSelectedStudentId(student.admissionNo)} className="bg-zinc-900 p-4 rounded-2xl shadow-sm border-none flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.99]">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <img src={getOptimizedPhotoUrl(student.photoUrl) || `https://ui-avatars.com/api/?name=${student.name}&background=random`} className="w-12 h-12 rounded-full object-cover bg-zinc-800 border-none shrink-0" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${student.name}&background=random`; }} />
                                                <div className="min-w-0 flex flex-col"><h4 className="text-sm font-bold text-white truncate leading-tight">{student.name}</h4><div className="flex items-center gap-1 mt-0.5"><span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wide">Roll:</span><span className="text-[10px] font-bold text-emerald-600">{rollNumbers[student.admissionNo] || '-'}</span></div></div>
                                            </div>
                                            <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button disabled={isLocked} onClick={() => toggleAttendance(student.admissionNo, 'Present')} className={`h-9 px-4 rounded-xl text-[10px] font-bold uppercase transition-all ${isPresent ? 'bg-emerald-500 text-white shadow-md' : 'bg-zinc-800 text-zinc-500'}`}>Present</button>
                                                <button disabled={isLocked} onClick={() => toggleAttendance(student.admissionNo, 'Absent')} className={`h-9 px-4 rounded-xl text-[10px] font-bold uppercase transition-all ${isAbsent ? 'bg-rose-500 text-white shadow-md' : 'bg-zinc-800 text-zinc-500'}`}>Absent</button>
                                            </div>
                                        </div>
                                    );
                                }) : <div className="text-center py-12 text-zinc-600 font-medium text-sm">No students found.</div>}
                                <div className="pt-4"><button onClick={handleSubmit} disabled={submitting || isLocked} className="w-full h-14 bg-emerald-600 rounded-2xl shadow-xl text-white flex items-center justify-center gap-3 active:scale-[0.98] transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:bg-zinc-800">{submitting ? <LoaderIcon className="w-5 h-5 animate-spin" /> : isLocked ? <LockIcon className="w-5 h-5" /> : <CheckCircleIcon className="w-5 h-5" />}<span className="font-bold text-base tracking-wide">{submitting ? 'Submitting...' : isLocked ? 'Attendance Submitted (Locked)' : 'Submit Attendance'}</span></button></div>
                            </div>
                        </>
                    ) : <div className="flex flex-col items-center justify-center py-16 text-center animate-in fade-in zoom-in-95 bg-zinc-900 rounded-[2.5rem] border-none shadow-sm p-8"><div className="w-24 h-24 bg-orange-950/20 rounded-full flex items-center justify-center mb-6"><CalendarIcon className="w-10 h-10 text-orange-500" /></div><h2 className="text-2xl font-bold text-white mb-2">{isSunday ? "It's Sunday!" : "On Leave"}</h2>{teacherHoliday && <p className="text-sm text-zinc-400 italic bg-zinc-950/50 p-3 rounded-lg">"{teacherHoliday.description}"</p>}<p className="text-sm text-zinc-600 mt-4">Attendance marking is disabled for this date.</p></div>}
                </div>
            )}
        </div>

        <BaseModal isOpen={showHolidayModal} onClose={() => setShowHolidayModal(false)} title={teacherHoliday ? "Remove Leave" : "Mark Leave"} icon={<CalendarIcon className="w-6 h-6" />}>
            <div className="space-y-6"><div className="bg-zinc-950 p-4 rounded-2xl border-none"><p className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-1">Selected Date</p><p className="text-lg font-bold text-white">{dateLocale}</p></div>{!teacherHoliday ? <div className="space-y-2"><label className="text-xs font-bold text-zinc-500 uppercase ml-1">Reason / Description</label><Input value={holidayDescription} onChange={(e) => setHolidayDescription(e.target.value)} placeholder="e.g. Personal Leave, Sick" autoFocus className="bg-zinc-900 border-zinc-800 text-white" /></div> : <p className="text-zinc-300">Are you sure you want to remove your leave for this date?</p>}<div className="pt-2 flex gap-3"><Button variant="outline" onClick={() => setShowHolidayModal(false)} fullWidth className="h-12">Cancel</Button><Button onClick={handleHolidayAction} disabled={processingHoliday || (!teacherHoliday && !holidayDescription)} isLoading={processingHoliday} variant={teacherHoliday ? 'danger' : 'primary'} fullWidth className="h-12">{teacherHoliday ? 'Remove Leave' : 'Confirm Leave'}</Button></div></div>
        </BaseModal>
        <ExportAttendanceModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} currentUser={currentUser} />
    </div>
  );
};

const ExportAttendanceModal: React.FC<{ isOpen: boolean; onClose: () => void; currentUser: User | null }> = ({ isOpen, onClose, currentUser }) => {
    const [loading, setLoading] = useState(false);
    const [range, setRange] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });

    const handleExport = async () => {
        if (!currentUser?.assignedClass || !currentUser?.assignedSection) return;
        setLoading(true);
        try {
            const res = await sheetApi.exportAttendanceCSV({
                class: currentUser.assignedClass,
                section: currentUser.assignedSection,
                startDate: range.start,
                endDate: range.end,
                teacherId: currentUser.employeeId || ''
            });
            if (res.success && res.data) {
                const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `Attendance_${currentUser.assignedClass}_${range.start}_to_${range.end}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                onClose();
            } else {
                alert(res.message || "Export failed.");
            }
        } catch (e) {
            alert("Error during export.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Export Attendance" icon={<DownloadIcon className="w-6 h-6" />}>
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">From Date</label>
                        <Input type="date" value={range.start} onChange={e => setRange({...range, start: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">To Date</label>
                        <Input type="date" value={range.end} onChange={e => setRange({...range, end: e.target.value})} className="bg-zinc-900 border-zinc-800 text-white" />
                    </div>
                </div>
                <Button fullWidth isLoading={loading} onClick={handleExport} className="h-14">Generate CSV Report</Button>
            </div>
        </BaseModal>
    );
};
