import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, PlusIcon, RupeeBillIcon, CalendarIcon, LoaderIcon, FilterIcon, DownloadIcon } from '../components/Icons';
import { ExpenseDashboardData, User } from '../types';
import { sheetApi } from '../services/SheetApi';
import { AddExpenseModal } from '../components/ExpenseActionModals';

interface ExpensesViewProps {
  onBack: () => void;
  currentUser?: User | null;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({ onBack, currentUser }) => {
  const [dashboardData, setDashboardData] = useState<ExpenseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await sheetApi.getExpenses();
        if (res.success && res.data) setDashboardData(res.data);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [refreshKey]);

  const handleSuccess = () => setRefreshKey(p => p + 1);
  const formatCurrency = (amount: number) => "₹ " + amount.toLocaleString('en-IN');
  const getDayAndMonth = (isoString: string) => {
    const d = new Date(isoString); if(isNaN(d.getTime())) return { day: '-', month: '-' };
    return { day: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }) };
  };

  const filteredExpenses = dashboardData?.recentExpenses.filter(ex => {
     if (!dateRange.start && !dateRange.end) return true;
     const exDate = new Date(ex.date).setHours(0,0,0,0), start = dateRange.start ? new Date(dateRange.start).setHours(0,0,0,0) : null, end = dateRange.end ? new Date(dateRange.end).setHours(0,0,0,0) : null;
     if (start && exDate < start) return false; if (end && exDate > end) return false; return true;
  }) || [];

  const handleExportCSV = () => {
      if (!filteredExpenses.length) return;
      const csv = ['Receipt No,Date,Category,Title,Amount,Payment Mode,Reference,Remarks,Approved By', ...filteredExpenses.map(ex => [ex.receiptNumber || '-', ex.date, ex.category, `"${ex.title}"`, ex.amount, ex.paymentMode, ex.reference || '', `"${ex.remarks || ''}"`, ex.approvedBy].join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }), url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.setAttribute('download', `expenses_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6fc] dark:bg-black relative transition-colors duration-200">
      <div className="bg-red-600 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
          <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                  <h2 className="text-xl font-bold tracking-wide">Expenses</h2>
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all shadow-md active:scale-95 font-bold text-xs ${showFilters ? 'bg-white text-red-600' : 'bg-white/20 text-white border border-white/10'}`}><FilterIcon className="w-4 h-4" /><span>Filters</span></button>
          </div>
      </div>

      <div className="w-full px-6 pb-48 flex flex-col gap-6 mt-8 relative z-10">
         {showFilters && (<div className="bg-white dark:bg-zinc-900 p-5 rounded-[1.5rem] shadow-soft border-none animate-in slide-in-from-top-2 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase ml-1">From</label><input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))} className="w-full bg-slate-50 dark:bg-zinc-800 border-none rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-white" /></div><div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase ml-1">To</label><input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))} className="w-full bg-slate-50 dark:bg-zinc-800 border-none rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-white" /></div></div><div className="flex items-center justify-between pt-2"><button onClick={() => setDateRange({start: '', end: ''})} className="text-xs font-bold text-slate-400 hover:text-red-500">Reset</button><button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-bold active:scale-95">Export CSV</button></div></div>)}
         {loading ? <div className="flex justify-center py-20"><LoaderIcon className="w-10 h-10 animate-spin text-red-500" /></div> : (
            <><div className="relative w-full overflow-hidden bg-gradient-to-br from-red-500 to-red-700 dark:from-zinc-900 dark:to-zinc-950 dark:border dark:border-zinc-800 rounded-[2rem] p-6 shadow-glow text-white"><div className="relative z-10 flex flex-row items-center justify-between"><div className="flex flex-col gap-1"><div className="flex items-center gap-2 text-red-100 font-bold text-xs uppercase tracking-widest"><CalendarIcon className="w-4 h-4" /><span>This Month</span></div><h1 className="text-3xl font-bold tracking-tight">{formatCurrency(dashboardData?.monthlyExpenses || 0)}</h1></div><div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><RupeeBillIcon className="w-6 h-6" /></div></div></div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-6 border-none"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><span className="w-1.5 h-6 bg-red-500 rounded-full"></span>Recent Expenses</h3></div>
                    {filteredExpenses.length > 0 ? (<div className="space-y-3">{filteredExpenses.map((ex, idx) => { const { day, month } = getDayAndMonth(ex.date); return (<div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all gap-3 border-none shadow-sm"><div className="flex items-center gap-3 overflow-hidden"><div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 flex flex-col items-center justify-center shrink-0 text-red-500 font-bold shadow-sm"><span className="text-sm leading-none">{day}</span><span className="text-[9px] uppercase font-bold text-slate-400 leading-none mt-0.5">{month}</span></div><div className="min-w-0"><h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{ex.title}</h4><div className="flex items-center gap-1.5 mt-0.5"><span className="text-[10px] font-bold text-slate-500 truncate">{ex.category}</span><span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span><span className="text-[9px] font-bold text-slate-400">#{ex.receiptNumber}</span></div></div></div><div className="text-right shrink-0 ml-2"><p className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(ex.amount)}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{ex.paymentMode}</p></div></div>); })}</div>) : <div className="text-center py-10"><div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300"><RupeeBillIcon className="w-8 h-8" /></div><p className="text-slate-400 font-medium">No expenses found.</p></div>}
                </div></>
         )}
      </div>
      <div className="fixed bottom-28 left-4 right-4 z-[60] md:bottom-8 md:right-8 md:left-auto md:w-auto"><button onClick={() => setShowAddModal(true)} className="w-full md:w-auto h-14 bg-red-500 rounded-2xl md:rounded-full shadow-xl text-white flex items-center justify-center gap-2 px-6 hover:scale-105 active:scale-95 hover:bg-red-600"><PlusIcon className="w-5 h-5 md:w-6 md:h-6" /><span className="font-bold tracking-wide text-base">Add Expense</span></button></div>
      <AddExpenseModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} onSuccess={handleSuccess} user={currentUser ? { name: currentUser.name } : null} />
    </div>
  );
};