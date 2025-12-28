
import React, { useState } from 'react';
import { CalendarIcon, ClipboardListIcon, ChevronDownIcon, UsersIcon, BriefcaseIcon, GraduationCapIcon } from './Icons';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from './StudentActionModals';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Helper for Local Date
  const getLocalDate = () => {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
  };

  const [formData, setFormData] = useState({
    title: '',
    date: getLocalDate(),
    type: 'Academic',
    audience: 'all'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await sheetApi.addEvent({
            title: formData.title,
            date: formData.date,
            type: formData.type.toLowerCase() as any,
            audience: formData.audience as any
        });
        if (res.success) {
            onSuccess();
            onClose();
            // Reset form
            setFormData({ title: '', date: getLocalDate(), type: 'Academic', audience: 'all' });
        } else {
            alert('Failed to add event: ' + (res.message || 'Unknown error'));
        }
    } catch(e) {
        console.error(e);
        alert('An unexpected error occurred');
    } finally {
        setLoading(false);
    }
  };

  const audienceOptions = [
    { value: 'all', label: 'All', icon: UsersIcon, color: 'text-blue-500' },
    { value: 'staff', label: 'Staff Only', icon: BriefcaseIcon, color: 'text-purple-500' },
    { value: 'students', label: 'Students & Parents', icon: GraduationCapIcon, color: 'text-emerald-500' }
  ];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add New Event" icon={<CalendarIcon className="w-6 h-6" />}>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
                <Input 
                    label="EVENT TITLE"
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    required 
                    placeholder="e.g. Annual Sports Day"
                    className="h-14 bg-slate-100 dark:bg-slate-700/50"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <Input 
                        type="date" 
                        label="DATE"
                        icon={<CalendarIcon className="w-5 h-5" />}
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        required
                        className="h-14 bg-slate-100 dark:bg-slate-700/50"
                        style={{ colorScheme: 'dark' }} // Ensures internal calendar picker is usable in dark mode
                    />
                </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 ml-1">TYPE</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#197fe6] transition-colors">
                            <ClipboardListIcon className="w-5 h-5" />
                        </div>
                        <select 
                            className="w-full h-14 pl-12 pr-10 bg-slate-100 dark:bg-slate-700/50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#197fe6]/20 focus:bg-white dark:focus:bg-slate-700 outline-none dark:text-white transition-all appearance-none cursor-pointer"
                            value={formData.type}
                            onChange={e => setFormData({...formData, type: e.target.value})}
                        >
                            <option value="Academic">Academic</option>
                            <option value="Sports">Sports</option>
                            <option value="Holiday">Holiday</option>
                            <option value="Other">Other</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-[#197fe6] transition-colors">
                            <ChevronDownIcon className="w-4 h-4" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-400 dark:text-slate-500 ml-1">VISIBLE TO (AUDIENCE)</label>
                <div className="grid grid-cols-3 gap-3">
                    {audienceOptions.map((opt) => {
                        const isSelected = formData.audience === opt.value;
                        const Icon = opt.icon;
                        return (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => setFormData({ ...formData, audience: opt.value })}
                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${isSelected ? 'border-[#197fe6] bg-blue-50 dark:bg-blue-900/20 shadow-md' : 'border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60'}`}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? opt.color : 'text-slate-400'}`} />
                                <span className={`text-[9px] font-black uppercase tracking-tight ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{opt.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="pt-2">
                <Button fullWidth isLoading={loading} type="submit" className="h-14 text-base shadow-glow shadow-[#197fe6]/20">Create Event</Button>
            </div>
        </form>
    </BaseModal>
  );
};
