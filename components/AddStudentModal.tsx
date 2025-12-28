
import React, { useState, useEffect } from 'react';
import { UserPlusIcon, CheckCircleIcon, ChevronDownIcon, PhoneIcon, RupeeIcon } from './Icons';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { Student } from '../types';
import { BaseModal } from './StudentActionModals';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const getLocalDate = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
  };

  const [formData, setFormData] = useState({
    admissionNo: '',
    name: '',
    fatherName: '',
    motherName: '',
    dob: '',
    class: 'Playgroup',
    section: 'A',
    aadhaar: '',
    samagraId: '',
    address: '',
    phone1: '',
    phone2: '',
    joiningDate: getLocalDate(),
    totalFees: '',
    status: true 
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchAdmNo = async () => {
        try {
          const res = await sheetApi.getNextAdmissionNumber();
          if (res.success && res.data) {
            setFormData(prev => ({ ...prev, admissionNo: res.data! }));
          }
        } catch (e) {
          console.error("Failed to fetch admission no");
        }
      };
      fetchAdmNo();
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.phone1) {
        setError("Primary phone number is required.");
        return;
    }

    setLoading(true);
    try {
      const studentPayload: Omit<Student, 'photoUrl'> = {
        ...formData,
        status: formData.status ? 'Active' : 'Left',
        totalFees: Number(formData.totalFees) || 0
      };
      const response = await sheetApi.addStudent(studentPayload, photoFile || undefined);
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || "Failed to add student");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add New Student" icon={<UserPlusIcon className="w-6 h-6" />}>
       <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-2xl font-bold border border-red-100 dark:border-red-900/30 animate-in shake duration-300">{error}</div>}

          <div className="space-y-3 p-3 bg-slate-50 dark:bg-[#1e293b]/30 rounded-xl border border-slate-100 dark:border-white/5">
             <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2">Basic Information</h4>
             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Admission No.</label>
                    <input 
                    type="text" 
                    name="admissionNo"
                    value={formData.admissionNo} 
                    readOnly
                    className="w-full h-12 px-3 bg-slate-100 dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed font-mono font-bold"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Joining Date</label>
                    <input 
                    type="date" 
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleChange}
                    className="w-full h-12 px-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold dark:text-white"
                    style={{ colorScheme: 'dark' }}
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Student Photo</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-50 dark:file:bg-blue-900/30 file:text-blue-600 dark:file:text-blue-400 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl"
                />
            </div>

             <div className="space-y-1">
                <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} required placeholder="Student's official name" />
             </div>

             <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Class</label>
                    <div className="relative group">
                        <select 
                            name="class" 
                            value={formData.class} 
                            onChange={handleChange}
                            className="w-full h-12 px-4 pr-10 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:text-white appearance-none cursor-pointer transition-all"
                        >
                            {['Playgroup', 'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Section</label>
                    <div className="relative group">
                        <select 
                            name="section" 
                            value={formData.section} 
                            onChange={handleChange}
                            className="w-full h-12 px-4 pr-10 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:text-white appearance-none cursor-pointer transition-all"
                        >
                            {['A', 'B', 'C', 'D'].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <Input label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleChange} placeholder="Guardian 1" />
                <Input label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleChange} placeholder="Guardian 2" />
            </div>
        </div>

        {/* Contact & Fees Section */}
        <div className="space-y-3 p-3 bg-slate-50 dark:bg-[#1e293b]/30 rounded-xl border border-slate-100 dark:border-white/5">
             <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2">Contact & Fees</h4>
             <div className="grid grid-cols-2 gap-3">
                 <Input label="Phone 1 (Primary)" name="phone1" value={formData.phone1} onChange={handleChange} required maxLength={10} icon={<PhoneIcon className="w-4 h-4" />} placeholder="10 digits" />
                 <Input label="Phone 2 (Alt)" name="phone2" value={formData.phone2} onChange={handleChange} maxLength={10} icon={<PhoneIcon className="w-4 h-4" />} placeholder="Emergency contact" />
             </div>
             <div className="space-y-1">
                <Input label="Annual Fees (₹)" type="number" name="totalFees" value={formData.totalFees} onChange={handleChange} icon={<RupeeIcon className="w-4 h-4" />} placeholder="e.g. 25000" />
             </div>
        </div>

        <div className="space-y-3 p-3 bg-slate-50 dark:bg-[#1e293b]/30 rounded-xl border border-slate-100 dark:border-white/5">
             <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1 mb-2">Personal Details</h4>
             <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Date of Birth</label>
                 <input 
                     type="date" 
                     name="dob" 
                     value={formData.dob} 
                     onChange={handleChange}
                     className="w-full h-12 px-4 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:text-white" 
                     style={{ colorScheme: 'dark' }}
                 />
             </div>
             <div className="grid grid-cols-2 gap-3">
                 <Input label="Aadhaar No." name="aadhaar" value={formData.aadhaar} onChange={handleChange} maxLength={12} placeholder="12 digits" />
                 <Input label="Samagra ID" name="samagraId" value={formData.samagraId} onChange={handleChange} maxLength={9} placeholder="9 digits" />
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Residential Address</label>
                <textarea 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Full home address..."
                    className="w-full px-4 py-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:outline-none dark:text-white transition-all shadow-inner"
                ></textarea>
            </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Button type="button" variant="outline" onClick={onClose} fullWidth className="h-14 rounded-2xl">Cancel</Button>
          <Button type="submit" isLoading={loading} fullWidth className="h-14 rounded-2xl shadow-xl shadow-blue-500/20">Add Student</Button>
        </div>
       </form>
    </BaseModal>
  );
};
