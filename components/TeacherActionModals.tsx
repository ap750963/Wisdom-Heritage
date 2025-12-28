
import React, { useState } from 'react';
import { BaseModal } from './StudentActionModals';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { Student } from '../types';
import { CheckSquareIcon, ClipboardListIcon, FileTextIcon, LoaderIcon, CheckCircleIcon, PlusIcon, XIcon, WisdomLogo, ChevronDownIcon } from './Icons';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess: () => void;
}

export const MarkAttendanceModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, student, onSuccess }) => {
  // Helper for Local Date
  const getLocalDate = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
  };

  const [date, setDate] = useState(getLocalDate());
  const [status, setStatus] = useState<'Present' | 'Absent'>('Present');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sheetApi.markAttendance(student.admissionNo, status, date);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to mark attendance');
      }
    } catch (e) {
      alert('Error marking attendance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Mark Attendance" icon={<CheckSquareIcon className="w-6 h-6" />}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase">Date</label>
          <input 
            type="date" 
            className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-700 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#197fe6]/20 focus:bg-white outline-none dark:text-white"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            style={{ colorScheme: 'dark' }}
          />
        </div>
        
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setStatus('Present')}
            className={`flex-1 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${status === 'Present' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400'}`}
          >
            <span className="text-2xl font-bold">P</span>
            <span className="text-xs font-bold uppercase">Present</span>
          </button>
          <button
            type="button"
            onClick={() => setStatus('Absent')}
            className={`flex-1 h-20 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${status === 'Absent' ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-400'}`}
          >
            <span className="text-2xl font-bold">A</span>
            <span className="text-xs font-bold uppercase">Absent</span>
          </button>
        </div>

        <Button fullWidth isLoading={loading} type="submit" className="h-14">Submit Attendance</Button>
      </form>
    </BaseModal>
  );
};

export const EnterMarksModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, student, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [examName, setExamName] = useState('Half Yearly');
  const [subjects, setSubjects] = useState<{ id: number, subject: string, marks: number, maxMarks: number }[]>([
    { id: 1, subject: 'English', marks: 0, maxMarks: 100 },
    { id: 2, subject: 'Mathematics', marks: 0, maxMarks: 100 },
    { id: 3, subject: 'Science', marks: 0, maxMarks: 100 }
  ]);

  const updateSubject = (id: number, field: string, value: any) => {
    setSubjects(subjects.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const addSubject = () => {
    setSubjects([...subjects, { id: Date.now(), subject: '', marks: 0, maxMarks: 100 }]);
  };

  const removeSubject = (id: number) => {
    setSubjects(subjects.filter(s => s.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sheetApi.addMarks(student.admissionNo, examName, subjects);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        alert(res.message || 'Failed to submit marks');
      }
    } catch (e) {
      alert('Error submitting marks');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Enter Exam Marks" icon={<ClipboardListIcon className="w-6 h-6" />}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase">Exam Name</label>
          <div className="relative">
              <select 
                className="w-full h-12 px-4 pr-10 bg-slate-100 dark:bg-slate-700 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-[#197fe6]/20 focus:bg-white outline-none dark:text-white appearance-none cursor-pointer"
                value={examName}
                onChange={e => setExamName(e.target.value)}
              >
                <option>Unit Test 1</option>
                <option>Quarterly</option>
                <option>Half Yearly</option>
                <option>Unit Test 2</option>
                <option>Finals</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                  <ChevronDownIcon className="w-4 h-4" />
              </div>
          </div>
        </div>

        <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
          {subjects.map((sub, idx) => (
            <div key={sub.id} className="flex gap-2 items-center">
              <input 
                placeholder="Subject"
                className="flex-1 h-10 px-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#197fe6]/20 dark:text-white"
                value={sub.subject}
                onChange={e => updateSubject(sub.id, 'subject', e.target.value)}
              />
              <input 
                type="number"
                placeholder="Obt"
                className="w-16 h-10 px-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#197fe6]/20 text-center dark:text-white"
                value={sub.marks}
                onChange={e => updateSubject(sub.id, 'marks', Number(e.target.value))}
              />
              <span className="text-slate-300 text-sm">/</span>
              <input 
                type="number"
                placeholder="Max"
                className="w-16 h-10 px-2 bg-slate-50 dark:bg-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#197fe6]/20 text-center dark:text-white"
                value={sub.maxMarks}
                onChange={e => updateSubject(sub.id, 'maxMarks', Number(e.target.value))}
              />
              {subjects.length > 1 && (
                <button type="button" onClick={() => removeSubject(sub.id)} className="p-2 text-slate-300 hover:text-red-500">
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <button type="button" onClick={addSubject} className="text-xs font-bold text-[#197fe6] flex items-center gap-1 hover:underline ml-1">
          <PlusIcon className="w-3 h-3" /> Add Subject
        </button>

        <Button fullWidth isLoading={loading} type="submit" className="h-14">Submit Marks</Button>
      </form>
    </BaseModal>
  );
};

export const GenerateReportCardModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, student }) => {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const html = `
        <html>
        <head>
          <title>Report Card - ${student.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap');
            body { font-family: 'Roboto', sans-serif; padding: 40px; -webkit-print-color-adjust: exact; }
            .container { border: 2px solid #000; padding: 30px; max-width: 800px; margin: 0 auto; position: relative; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .school-name { font-size: 32px; font-weight: 900; color: #cc1f28; text-transform: uppercase; margin: 0; }
            .sub-header { font-size: 14px; font-weight: 700; text-transform: uppercase; margin-top: 5px; }
            .student-info { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
            .info-item { flex: 1 0 40%; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .info-label { font-weight: 700; margin-right: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: center; font-size: 14px; }
            th { background-color: #f0f0f0; font-weight: 700; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; font-weight: 700; font-size: 14px; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; width: 400px; pointer-events: none; }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://drive.google.com/thumbnail?id=1_-tuFs5TIuJuHcynSHX9g1pp3QMHF4gg&sz=w1000" class="watermark" />
            <div class="header">
               <h1 class="school-name">WISDOM HERITAGE</h1>
               <div class="sub-header">Annual Report Card (Session 2024-25)</div>
            </div>
            
            <div class="student-info">
               <div class="info-item"><span class="info-label">Name:</span> ${student.name}</div>
               <div class="info-item"><span class="info-label">Class:</span> ${student.class} - ${student.section}</div>
               <div class="info-item"><span class="info-label">Admission No:</span> ${student.admissionNo}</div>
               <div class="info-item"><span class="info-label">Father's Name:</span> ${student.fatherName}</div>
               <div class="info-item"><span class="info-label">Attendance:</span> 85% (Projected)</div>
            </div>

            <table>
               <thead>
                  <tr>
                     <th>Subject</th>
                     <th>Half Yearly (100)</th>
                     <th>Finals (100)</th>
                     <th>Total (200)</th>
                     <th>Grade</th>
                  </tr>
               </thead>
               <tbody>
                  <tr><td>English</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
                  <tr><td>Mathematics</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
                  <tr><td>Science</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
                  <tr><td>Social Studies</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
                  <tr><td>Hindi</td><td>-</td><td>-</td><td>-</td><td>-</td></tr>
               </tbody>
            </table>

            <div class="footer">
               <div>Class Teacher</div>
               <div>Principal</div>
               <div>Parent</div>
            </div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
      `;
      printWindow.document.write(html);
      printWindow.document.close();
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Report Card" icon={<FileTextIcon className="w-6 h-6" />}>
      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
         <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 mb-2">
             <FileTextIcon className="w-10 h-10" />
         </div>
         <div>
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Generate Report Card</h3>
             <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm max-w-xs mx-auto">This will generate a PDF report card for {student.name} based on available marks.</p>
         </div>
         
         <Button fullWidth onClick={handlePrint} className="h-14 mt-4">Download PDF</Button>
      </div>
    </BaseModal>
  );
};
