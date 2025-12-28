
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  LoaderIcon, 
  CalendarIcon, 
  TrashIcon, 
  PencilIcon,
  XIcon
} from '../components/Icons';
import { User, Homework } from '../types';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from '../components/StudentActionModals';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DateNavigator } from '../components/DateNavigator';

interface TeacherHomeworkViewProps {
  currentUser: User | null;
  onBack: () => void;
}

export const TeacherHomeworkView: React.FC<TeacherHomeworkViewProps> = ({ currentUser, onBack }) => {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchHomework();
  }, [selectedDate, currentUser]);

  const fetchHomework = async () => {
    if (!currentUser?.assignedClass) return;
    setLoading(true);
    try {
      const res = await sheetApi.getHomework(currentUser.assignedClass, currentUser.assignedSection || '', selectedDate);
      if (res.success && res.data) {
        setHomeworkList(res.data);
      } else {
        setHomeworkList([]);
      }
    } catch (e) {
      console.error(e);
      setHomeworkList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black font-sans transition-colors duration-200">
      <div className="bg-amber-500 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
          <div className="flex items-center justify-between text-white mb-6">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95">
                      <ArrowLeftIcon className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold tracking-wide">Homework</h2>
              </div>
              <button 
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-amber-600 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-all hover:bg-amber-50"
              >
                  <PlusIcon className="w-4 h-4" />
                  Assign Work
              </button>
          </div>

          <DateNavigator value={selectedDate} onChange={setSelectedDate} variant="amber" className="h-[50px]" />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 relative z-10">
        {loading ? (
            <div className="flex justify-center py-20 animate-in fade-in duration-500">
                <LoaderIcon className="w-8 h-8 animate-spin text-amber-500/50" />
            </div>
        ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {homeworkList.length > 0 ? (
                    <div className="space-y-4 pb-32">
                        {homeworkList.map((hw, idx) => (
                            <div key={hw.id || idx} className="bg-zinc-900 p-5 rounded-3xl shadow-sm border-none space-y-3">
                                <div className="flex justify-between items-start">
                                    <span className="px-3 py-1 bg-amber-950/30 text-amber-400 text-[10px] font-black uppercase rounded-lg border border-zinc-800">
                                        {hw.subject}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {hw.content}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-zinc-900 rounded-[2.5rem] border-none shadow-sm">
                        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-700">
                            <PencilIcon className="w-8 h-8" />
                        </div>
                        <h3 className="text-white font-bold text-lg">No work for today</h3>
                        <p className="text-zinc-500 text-sm mt-1">Tap "Assign Work" to add new tasks.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {currentUser && (
        <AddHomeworkModal 
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            onSuccess={() => { setShowAddModal(false); fetchHomework(); }}
            currentUser={currentUser}
            initialDate={selectedDate}
        />
      )}
    </div>
  );
};

const AddHomeworkModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; currentUser: User; initialDate: string }> = ({ isOpen, onClose, onSuccess, currentUser, initialDate }) => {
    const [date, setDate] = useState(initialDate);
    const [entries, setEntries] = useState<{ subject: string; content: string }[]>([{ subject: '', content: '' }]);
    const [loading, setLoading] = useState(false);

    const handleAddEntry = () => setEntries([...entries, { subject: '', content: '' }]);
    const handleRemoveEntry = (idx: number) => setEntries(entries.filter((_, i) => i !== idx));
    const handleEntryChange = (idx: number, field: 'subject' | 'content', value: string) => {
        const newEntries = [...entries];
        newEntries[idx] = { ...newEntries[idx], [field]: value };
        setEntries(newEntries);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (entries.some(en => !en.subject || !en.content)) return alert("Please fill all homework fields.");
        setLoading(true);
        try {
            const res = await sheetApi.addHomework({
                className: currentUser.assignedClass || '',
                section: currentUser.assignedSection || '',
                date: date,
                entries: entries
            });
            if (res.success) onSuccess();
            else alert(String(res.message || "Failed to post homework."));
        } catch (e) { alert("A system error occurred while assigning homework."); }
        finally { setLoading(false); }
    };

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} title="Assign Homework" icon={<PencilIcon className="w-6 h-6" />}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Homework Date</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full h-12 px-4 bg-zinc-900 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500/20 outline-none text-white" required />
                </div>

                <div className="space-y-6">
                    <div className="flex justify-between items-center px-1">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks</h4>
                        <button type="button" onClick={handleAddEntry} className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:underline">+ Add Subject</button>
                    </div>
                    {entries.map((entry, idx) => (
                        <div key={idx} className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 relative group">
                            {entries.length > 1 && (
                                <button type="button" onClick={() => handleRemoveEntry(idx)} className="absolute top-2 right-2 p-2 text-slate-300 hover:text-red-500"><XIcon className="w-4 h-4" /></button>
                            )}
                            <div className="space-y-3">
                                <Input label="Subject" placeholder="e.g. Science" value={entry.subject} onChange={e => handleEntryChange(idx, 'subject', e.target.value)} required className="bg-zinc-900 border-none" />
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Work Description</label>
                                    <textarea rows={3} placeholder="Describe the task..." value={entry.content} onChange={e => handleEntryChange(idx, 'content', e.target.value)} required className="w-full p-4 bg-zinc-900 border-none rounded-2xl text-sm font-medium outline-none text-white" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="pt-2"><Button type="submit" fullWidth isLoading={loading} className="h-14 bg-amber-500 hover:bg-amber-600 shadow-amber-500/20">Assign to Students</Button></div>
            </form>
        </BaseModal>
    );
};
