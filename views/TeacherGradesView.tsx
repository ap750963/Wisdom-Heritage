import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  SearchIcon, 
  LoaderIcon, 
  PlusIcon,
  ClipboardListIcon,
  CheckCircleIcon,
  XIcon,
  PencilIcon,
  DownloadIcon,
  ChevronDownIcon
} from '../components/Icons';
import { Student, User, ExamDefinition, SubjectDefinition } from '../types';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from '../components/StudentActionModals';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface TeacherGradesViewProps {
  currentUser: User | null;
  onBack: () => void;
}

export const TeacherGradesView: React.FC<TeacherGradesViewProps> = ({ currentUser, onBack }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<ExamDefinition[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<string, Record<string, number>>>({});
  const [selectedExamId, setSelectedExamId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [studentToGrade, setStudentToGrade] = useState<Student | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [studentsRes, examsRes] = await Promise.all([
            sheetApi.getStudents(currentUser),
            sheetApi.getExams()
        ]);
        if (studentsRes.success && studentsRes.data) {
          const sorted = studentsRes.data.sort((a, b) => {
             const rollA = a.rollNo ? parseInt(a.rollNo) : 9999;
             const rollB = b.rollNo ? parseInt(b.rollNo) : 9999;
             if (rollA !== rollB) return rollA - rollB;
             return a.name.localeCompare(b.name);
          });
          setStudents(sorted);
        }
        if (examsRes.success && examsRes.data) {
            setExams(examsRes.data);
            if (examsRes.data.length > 0) setSelectedExamId(examsRes.data[examsRes.data.length - 1].examId);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  useEffect(() => {
      if (!selectedExamId || !currentUser?.assignedClass || !currentUser?.assignedSection) {
          setResultsMap({});
          return;
      }
      const selectedExam = exams.find(e => e.examId === selectedExamId);
      if (!selectedExam) return;
      const fetchResults = async () => {
          setLoading(true);
          try {
              const res = await sheetApi.getClassResults(selectedExam.examName, currentUser.assignedClass!, currentUser.assignedSection!);
              if (res.success && res.data) setResultsMap(res.data);
              else setResultsMap({});
          } finally { setLoading(false); }
      };
      fetchResults();
  }, [selectedExamId, exams, currentUser]);

  const handleCreateExamSuccess = async () => {
    const examsRes = await sheetApi.getExams();
    if (examsRes.success && examsRes.data) {
        setExams(examsRes.data);
        if (examsRes.data.length > 0) setSelectedExamId(examsRes.data[examsRes.data.length - 1].examId);
    }
    setShowCreateExamModal(false);
  };

  const handleGradeSaveSuccess = async () => {
    if (!selectedExamId || !currentUser?.assignedClass || !currentUser?.assignedSection) return;
    const selectedExam = exams.find(e => e.examId === selectedExamId);
    if (!selectedExam) return;
    
    setLoading(true);
    try {
        const res = await sheetApi.getClassResults(selectedExam.examName, currentUser.assignedClass, currentUser.assignedSection);
        if (res.success && res.data) setResultsMap(res.data);
    } finally { setLoading(false); }
    setShowGradeModal(false);
  };

  const handleDownloadCSV = () => {
    const selectedExam = exams.find(e => e.examId === selectedExamId);
    if (!selectedExam || students.length === 0) return;
    const headers = ['Roll No', 'Student Name', 'Admission No', ...selectedExam.subjects.map(s => s.name), 'Total Obtained', 'Total Max', 'Percentage'];
    const rows = filteredStudents.map(student => {
      const studentMarks = resultsMap[student.admissionNo] || {};
      let totalObtained = 0, totalMax = 0;
      const subjectMarks = selectedExam.subjects.map(sub => {
        const marks = studentMarks[sub.name];
        if (marks !== undefined) totalObtained += marks;
        totalMax += sub.maxMarks;
        return marks !== undefined ? marks : '-';
      });
      const percentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
      return [student.rollNo || '-', `"${student.name}"`, student.admissionNo, ...subjectMarks, totalObtained, totalMax, `${percentage}%`];
    });
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }), url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.setAttribute('download', `Grades_${currentUser?.assignedClass}_${selectedExam.examName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.rollNo && s.rollNo.includes(searchQuery)));
  const selectedExam = exams.find(e => e.examId === selectedExamId);
  const getStudentStats = (admissionNo: string) => {
      const studentMarks = resultsMap[admissionNo];
      if (!selectedExam || !studentMarks) return null;
      let totalObtained = 0, totalMax = 0, subjectCount = 0;
      selectedExam.subjects.forEach(sub => {
          if (studentMarks[sub.name] !== undefined) { totalObtained += studentMarks[sub.name]; subjectCount++; }
          totalMax += sub.maxMarks;
      });
      if (subjectCount === 0) return null;
      return { percentage: Math.round((totalObtained / totalMax) * 100), totalObtained, totalMax };
  };

  const getOptimizedPhotoUrl = (url: string) => {
    if (!url) return '';
    if (url.includes('id=')) {
      const idMatch = url.match(/id=([^&]+)/);
      if (idMatch && idMatch[1]) return `https://drive.google.com/thumbnail?id=${idMatch[1]}&sz=w1000`;
    }
    return url;
  };

  return (
    <div className="flex flex-col h-full bg-[#f2f6fc] dark:bg-black font-sans transition-colors duration-200">
        <div className="bg-purple-600 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
            <div className="flex items-center justify-between text-white mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                    <h2 className="text-xl font-bold tracking-wide">Grades</h2>
                </div>
                <button onClick={() => setShowCreateExamModal(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-purple-600 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all"><PlusIcon className="w-4 h-4" />New Exam</button>
            </div>
            <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70"><ClipboardListIcon className="w-5 h-5" /></div>
                <select value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} className="w-full h-[50px] pl-12 pr-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white font-bold text-sm focus:outline-none focus:bg-white/20 appearance-none cursor-pointer">
                    <option value="" className="text-slate-900">Select an Exam</option>
                    {exams.map(exam => <option key={exam.examId} value={exam.examId} className="text-slate-900">{exam.examName}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/70"><ChevronDownIcon className="w-4 h-4" /></div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 space-y-6 relative z-10">
            <div className="relative group"><div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><SearchIcon className="h-5 w-5 text-slate-400" /></div><input className="block w-full pl-11 pr-4 h-14 border-none rounded-2xl bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-sm font-medium" placeholder="Search student..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
            {loading ? <div className="flex justify-center py-10"><LoaderIcon className="w-8 h-8 animate-spin text-purple-600" /></div> : filteredStudents.length > 0 ? (
                <div className="space-y-3 pb-32">
                    {filteredStudents.map(student => {
                        const stats = getStudentStats(student.admissionNo), photoSrc = getOptimizedPhotoUrl(student.photoUrl) || `https://ui-avatars.com/api/?name=${student.name}&background=random`;
                        return (
                            <div key={student.admissionNo} onClick={() => { if (!selectedExam) return alert("Please select an exam first."); setStudentToGrade(student); setShowGradeModal(true); }} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.98] border-none">
                                <div className="flex items-center gap-3 min-w-0"><img src={photoSrc} className="w-12 h-12 rounded-full object-cover bg-slate-100 dark:bg-zinc-800 shrink-0 border-none" referrerPolicy="no-referrer" onError={(e) => { (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${student.name}&background=random`; }} /><div className="min-w-0"><h4 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">{student.name}</h4><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Roll: <span className="text-purple-600">{student.rollNo || '-'}</span></p></div></div>
                                <div className="shrink-0 text-right">{stats ? (<div><p className={`text-lg font-bold ${stats.percentage >= 33 ? 'text-emerald-500' : 'text-red-500'}`}>{stats.percentage}%</p><p className="text-[9px] font-bold text-slate-400 uppercase">{stats.totalObtained}/{stats.totalMax}</p></div>) : (<div className="h-9 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800 text-slate-400 text-[10px] font-bold uppercase flex items-center justify-center">Enter</div>)}</div>
                            </div>
                        );
                    })}
                    <div className="pt-6"><button onClick={handleDownloadCSV} disabled={!selectedExam} className="w-full h-14 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border-none text-purple-600 font-bold flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"><DownloadIcon className="w-5 h-5" />Download Results (CSV)</button></div>
                </div>
            ) : <div className="text-center py-12 text-slate-400 font-medium text-sm">No students found.</div>}
        </div>

        <CreateExamModal isOpen={showCreateExamModal} onClose={() => setShowCreateExamModal(false)} onSuccess={handleCreateExamSuccess} currentUser={currentUser} />
        {selectedExam && studentToGrade && (
            <GradeEntryModal isOpen={showGradeModal} onClose={() => { setShowGradeModal(false); setStudentToGrade(null); }} exam={selectedExam} student={studentToGrade} initialMarks={resultsMap[studentToGrade.admissionNo] || {}} onSuccess={handleGradeSaveSuccess} classNameContext={{ className: currentUser?.assignedClass!, section: currentUser?.assignedSection! }} />
        )}
    </div>
  );
};

// Fix: Implemented CreateExamModal component
const CreateExamModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; currentUser: User | null }> = ({ isOpen, onClose, onSuccess, currentUser }) => {
    const [examName, setExamName] = useState('');
    const [subjects, setSubjects] = useState<SubjectDefinition[]>([{ name: '', maxMarks: 100 }]);
    const [loading, setLoading] = useState(false);

    const handleAddSubject = () => setSubjects([...subjects, { name: '', maxMarks: 100 }]);
    const handleRemoveSubject = (idx: number) => setSubjects(subjects.filter((_, i) => i !== idx));
    const handleSubjectChange = (idx: number, field: keyof SubjectDefinition, value: any) => {
        const newSubjects = [...subjects];
        newSubjects[idx] = { ...newSubjects[idx], [field]: value };
        setSubjects(newSubjects);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!examName) return alert("Exam name is required.");
        if (subjects.some(s => !s.name)) return alert("All subjects must have names.");
        setLoading(true);
        try {
            const res = await sheetApi.createExam(examName, subjects, currentUser?.name || 'Teacher');
            if (res.success) onSuccess();
            else alert(res.message);
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Configure New Exam" icon={<PlusIcon className="w-6 h-6" />}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <Input label="Exam Name" value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Unit Test 1" required />
                <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject List</label>
                        <button type="button" onClick={handleAddSubject} className="text-[10px] font-black text-purple-600 uppercase tracking-widest hover:underline">+ Add Subject</button>
                    </div>
                    {subjects.map((s, idx) => (
                        <div key={idx} className="flex gap-2 items-end">
                            <div className="flex-1">
                                <Input value={s.name} onChange={e => handleSubjectChange(idx, 'name', e.target.value)} placeholder="Subject" required />
                            </div>
                            <div className="w-24">
                                <Input type="number" value={s.maxMarks} onChange={e => handleSubjectChange(idx, 'maxMarks', parseInt(e.target.value))} placeholder="Max" required />
                            </div>
                            {subjects.length > 1 && (
                                <button type="button" onClick={() => handleRemoveSubject(idx)} className="p-3 text-slate-300 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
                            )}
                        </div>
                    ))}
                </div>
                <Button type="submit" fullWidth isLoading={loading} className="h-14 bg-purple-600 hover:bg-purple-700">Create Examination</Button>
            </form>
        </BaseModal>
    );
};

// Fix: Implemented GradeEntryModal component
const GradeEntryModal: React.FC<{ isOpen: boolean; onClose: () => void; exam: ExamDefinition; student: Student; initialMarks: Record<string, number>; onSuccess: () => void; classNameContext: { className: string, section: string } }> = ({ isOpen, onClose, exam, student, initialMarks, onSuccess, classNameContext }) => {
    const [marks, setMarks] = useState<Record<string, number>>(initialMarks);
    const [loading, setLoading] = useState(false);

    const handleMarkChange = (subject: string, val: string) => {
        setMarks(prev => ({ ...prev, [subject]: parseInt(val) || 0 }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const marksList = Object.entries(marks).map(([subject, m]) => ({
                subject,
                marks: m,
                maxMarks: exam.subjects.find(s => s.name === subject)?.maxMarks || 100
            }));
            const res = await sheetApi.saveStudentMarks(student.admissionNo, exam.examName, marksList, classNameContext.className, classNameContext.section);
            if (res.success) onSuccess();
            else alert(res.message);
        } finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Enter Grades" icon={<PencilIcon className="w-6 h-6" />}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800">
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">{student.name.charAt(0)}</div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{student.name}</h4>
                        <p className="text-xs text-slate-400">Roll No: {student.rollNo || '-'}</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {exam.subjects.map(s => (
                        <div key={s.name} className="flex items-center justify-between gap-4">
                            <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{s.name}</span>
                            <div className="flex items-center gap-2">
                                <input type="number" value={marks[s.name] ?? ''} onChange={e => handleMarkChange(s.name, e.target.value)} max={s.maxMarks} className="w-20 h-11 px-3 bg-slate-100 dark:bg-zinc-800 border-none rounded-xl text-center font-bold dark:text-white" placeholder="0" />
                                <span className="text-xs font-bold text-slate-300">/ {s.maxMarks}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <Button type="submit" fullWidth isLoading={loading} className="h-14">Save Performance</Button>
            </form>
        </BaseModal>
    );
};
