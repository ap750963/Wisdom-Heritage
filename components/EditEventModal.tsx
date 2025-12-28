
import React, { useState, useEffect } from 'react';
import { CalendarIcon, ClipboardListIcon, ChevronDownIcon, UsersIcon, BriefcaseIcon, GraduationCapIcon } from './Icons';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { CalendarEvent } from '../types';
import { BaseModal } from './StudentActionModals';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event: CalendarEvent;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({ isOpen, onClose, onSuccess, event }) => {
  const [loading, setLoading] = useState(false);
  
  // Format incoming date string "Mar 25, 2024" to "YYYY-MM-DD" for input[type=date]
  const formatDateForInput = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    id: event.id,
    title: event.title,
    date: formatDateForInput(event.date),
    type: event.type,
    audience: event.audience || 'all'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        id: event.id,
        title: event.title,
        date: formatDateForInput(event.date),
        type: event.type,
        audience: event.audience || 'all'
      });
    }
  }, [isOpen, event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        const res = await sheetApi.updateEvent({
            ...formData,
            type: formData.type.toLowerCase() as any
        });
        if (res.success) {
            onSuccess();
            onClose();
        } else {
            alert('Failed to update event: ' + (res.message || 'Unknown error'));
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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Event Details" icon={<CalendarIcon className="w-6 h-6" />}>
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
                        style={{ colorScheme: 'dark' }}
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
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                        >
                            <option value="academic">Academic</option>
                            <option value="sports">Sports</option>
                            <option value="holiday">Holiday</option>
                            <option value="other">Other</option>
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
                                onClick={() => setFormData({ ...formData, audience: opt.value as any })}
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
                <Button fullWidth isLoading={loading} type="submit" className="h-14 text-base shadow-glow shadow-[#197fe6]/20">Update Event</Button>
            </div>
        </form>
    </BaseModal>
  );
};
