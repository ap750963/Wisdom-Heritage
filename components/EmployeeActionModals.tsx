
import React, { useState, useEffect } from 'react';
import { UserPlusIcon, PencilIcon, CalendarIcon, LoaderIcon, ChevronDownIcon, ClockIcon } from './Icons';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { Employee, AttendanceStats } from '../types';
import { BaseModal } from './StudentActionModals';

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeToEdit?: Employee; // If present, it's Edit mode
}

export const EmployeeModal: React.FC<EmployeeModalProps> = ({ isOpen, onClose, onSuccess, employeeToEdit }) => {
  const isEditMode = !!employeeToEdit;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Helper for Local Date
  const getLocalDate = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
  };

  // Form State
  const initialFormState: Employee = {
    employeeId: '',
    name: '',
    fatherName: '',
    motherName: '',
    post: '',
    qualification: '',
    experience: '',
    joiningDate: getLocalDate(),
    salary: 0,
    phone1: '',
    phone2: '',
    email: '',
    address: '',
    dob: '',
    gender: 'Male',
    aadhaar: '',
    pan: '',
    bankAccount: '',
    ifsc: ''
  };

  const [formData, setFormData] = useState<Employee>(initialFormState);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      setError('');
      setPhotoFile(null);
      if (isEditMode && employeeToEdit) {
        // Format dates for input type="date"
        const formatDate = (d: string) => {
            if (!d) return '';
            const date = new Date(d);
            return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
        };
        setFormData({
            ...employeeToEdit,
            dob: formatDate(employeeToEdit.dob || ''),
            joiningDate: formatDate(employeeToEdit.joiningDate)
        });
      } else {
        // Add Mode: Fetch Next ID
        setFormData(initialFormState);
        const fetchNextId = async () => {
          try {
            const res = await sheetApi.getNextEmployeeId();
            if (res.success && res.data) {
                setFormData(prev => ({ ...prev, employeeId: res.data! }));
            } else {
                setFormData(prev => ({ ...prev, employeeId: 'EMP001' }));
            }
          } catch(e) {}
        };
        fetchNextId();
      }
    }
  }, [isOpen, employeeToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const validate = (): string | null => {
    if (!formData.name) return "Employee Name is required";
    if (!formData.post) return "Post/Designation is required";
    if (!formData.phone1) return "Primary Phone is required";
    if (formData.phone1.length !== 10) return "Phone number must be 10 digits";
    if (!formData.joiningDate) return "Joining Date is required";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Invalid email format";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      let response;
      const payload = { ...formData, salary: Number(formData.salary) };
      
      if (isEditMode) {
        response = await sheetApi.updateEmployee(payload, photoFile || undefined);
      } else {
        response = await sheetApi.addEmployee(payload, photoFile || undefined);
      }

      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || "Operation failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={isEditMode ? "Edit Employee" : "Register Employee"} 
        icon={isEditMode ? <PencilIcon className="w-6 h-6" /> : <UserPlusIcon className="w-6 h-6" />}
    >
       <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl font-medium">{error}</div>}

          {/* Basic Details */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700">
             <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Basic Details</h4>
             <div className="grid grid-cols-3 gap-4">
                 <div className="col-span-1 space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Employee ID</label>
                    <input type="text" value={formData.employeeId} readOnly className="w-full h-12 px-4 bg-slate-100 dark:bg-slate-700 border-none rounded-2xl text-sm text-slate-500 font-mono font-bold" />
                 </div>
                 <div className="col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Full Name</label>
                    <Input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. John Doe" />
                 </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Father's Name</label>
                    <Input name="fatherName" value={formData.fatherName} onChange={handleChange} />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Mother's Name</label>
                    <Input name="motherName" value={formData.motherName} onChange={handleChange} />
                </div>
            </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-900/50 file:text-indigo-700 dark:file:text-indigo-300 hover:file:bg-indigo-100"
                />
            </div>
          </div>

          {/* Professional Details */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700">
             <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Professional Details</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Post / Designation</label>
                    <Input name="post" value={formData.post} onChange={handleChange} required placeholder="e.g. Senior Teacher" />
                </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Qualification</label>
                    <Input name="qualification" value={formData.qualification} onChange={handleChange} placeholder="e.g. M.Sc, B.Ed" />
                </div>
             </div>
             <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Exp (Yrs)</label>
                    <Input name="experience" value={formData.experience} onChange={handleChange} placeholder="e.g. 5" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Joining Date</label>
                    <input 
                      type="date" 
                      name="joiningDate" 
                      value={formData.joiningDate} 
                      onChange={handleChange} 
                      className="w-full h-12 px-4 bg-white dark:bg-slate-700 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" 
                      required 
                      style={{ colorScheme: 'dark' }}
                    />
                </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Salary (₹)</label>
                    <Input type="number" name="salary" value={formData.salary} onChange={handleChange} placeholder="0" />
                </div>
             </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700">
             <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Contact Details</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Phone 1 *</label>
                    <Input name="phone1" value={formData.phone1} onChange={handleChange} required maxLength={10} placeholder="10 digits" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Phone 2</label>
                    <Input name="phone2" value={formData.phone2} onChange={handleChange} maxLength={10} />
                </div>
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Email</label>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" />
             </div>
             <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Address</label>
                <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full p-4 bg-white dark:bg-slate-700 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white"></textarea>
            </div>
          </div>

          {/* Optional Details */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700">
             <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">Optional Details</h4>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Date of Birth</label>
                    <input 
                      type="date" 
                      name="dob" 
                      value={formData.dob} 
                      onChange={handleChange} 
                      className="w-full h-12 px-4 bg-white dark:bg-slate-700 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white" 
                      style={{ colorScheme: 'dark' }}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Gender</label>
                    <div className="relative">
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full h-12 px-4 pr-10 bg-white dark:bg-slate-700 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white appearance-none cursor-pointer">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Aadhaar No</label>
                    <Input name="aadhaar" value={formData.aadhaar} onChange={handleChange} />
                </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">PAN No</label>
                    <Input name="pan" value={formData.pan} onChange={handleChange} />
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">Bank Account</label>
                    <Input name="bankAccount" value={formData.bankAccount} onChange={handleChange} />
                </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase ml-1">IFSC Code</label>
                    <Input name="ifsc" value={formData.ifsc} onChange={handleChange} />
                </div>
             </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} fullWidth className="h-14">Cancel</Button>
            <Button type="submit" isLoading={loading} fullWidth className="h-14 shadow-lg shadow-indigo-500/20">{isEditMode ? 'Save Changes' : 'Register Employee'}</Button>
          </div>
       </form>
    </BaseModal>
  );
};

export const EmployeeAttendanceModal: React.FC<{ isOpen: boolean; onClose: () => void; employee: Employee }> = ({ isOpen, onClose, employee }) => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      sheetApi.getEmployeeAttendance(employee.employeeId).then(res => {
        if (res.success && res.data) setStats(res.data);
        setLoading(false);
      });
    }
  }, [isOpen, employee.employeeId]);

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'Present': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300';
          case 'Absent': return 'text-rose-600 bg-rose-100 dark:bg-rose-900/40 dark:text-rose-300';
          case 'Late': return 'text-amber-600 bg-amber-100 dark:bg-amber-900/40 dark:text-amber-300';
          case 'Half Day': return 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-300';
          default: return 'text-slate-600 bg-slate-100 dark:bg-slate-700 dark:text-slate-300';
      }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Attendance History" icon={<CalendarIcon className="w-6 h-6" />}>
      {loading ? (
         <div className="flex justify-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : (
        <div className="space-y-8">
           <div className="flex items-center gap-4">
              <div className="flex-1 p-5 bg-emerald-50 dark:bg-emerald-900/30 rounded-[1.5rem] text-center border border-emerald-100 dark:border-emerald-800">
                 <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-widest mb-1">Attendance</p>
                 <p className="text-3xl font-black text-emerald-900 dark:text-emerald-200">{stats?.percentage || 0}%</p>
              </div>
              <div className="flex-1 p-5 bg-rose-50 dark:bg-rose-900/30 rounded-[1.5rem] text-center border border-rose-100 dark:border-rose-800">
                 <p className="text-[10px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest mb-1">Absences</p>
                 <p className="text-3xl font-black text-rose-900 dark:text-rose-200">{stats?.absentCount || 0} <span className="text-sm font-bold opacity-60">Days</span></p>
              </div>
           </div>
           
           {stats && stats.recentHistory.length > 0 ? (
             <div>
               <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 ml-1">Recent Activity</h4>
               <div className="space-y-2">
                  {stats.recentHistory.map((rec, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">{rec.date}</span>
                      <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${getStatusColor(rec.status)}`}>
                        {rec.status}
                      </span>
                    </div>
                  ))}
               </div>
             </div>
           ) : (
             <div className="text-center text-slate-400 text-sm font-medium py-4">No attendance records found.</div>
           )}
        </div>
      )}
    </BaseModal>
  );
};
