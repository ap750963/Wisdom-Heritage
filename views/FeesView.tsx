import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, RupeeIcon, LoaderIcon, BanknoteIcon, CalendarIcon, PrinterIcon, ShareIcon, XIcon, SchoolIcon, FilterIcon, DownloadIcon } from '../components/Icons';
import { FeeDashboardData, Student, FeeTransaction } from '../types';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from '../components/StudentActionModals';
import { CollectFeesModal } from '../components/CollectFeesModal';
import { StudentSearchModal } from '../components/StudentSearchModal';

interface FeesViewProps {
  onBack: () => void;
}

const numToWords = (n: number): string => {
  if (n === 0) return "Zero";
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"], tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const convert = (num: number): string => {
    if (num < 20) return units[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + units[num % 10] : "");
    if (num < 1000) return units[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + convert(num % 100) : "");
    if (num < 100000) return convert(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + convert(num % 100) : "");
    if (num < 10000000) return convert(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + convert(num % 100000) : "");
    return "Number too large";
  };
  return convert(n) + " Only";
};

export const FeesView: React.FC<FeesViewProps> = ({ onBack }) => {
  const [dashboardData, setDashboardData] = useState<FeeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feesModalOpen, setFeesModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTransaction, setSelectedTransaction] = useState<FeeTransaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await sheetApi.getFeeDashboard();
        if (res.success && res.data) setDashboardData(res.data);
      } finally { setLoading(false); }
    };
    fetchData();
  }, [refreshKey]);

  const handleStudentSelect = (student: Student) => { setSelectedStudent(student); setSearchOpen(false); setFeesModalOpen(true); };
  const handleFeeCollected = () => { setFeesModalOpen(false); setSelectedStudent(null); setRefreshKey(p => p + 1); };
  const getDayAndMonth = (isoString: string) => {
    const d = new Date(isoString); if (isNaN(d.getTime())) return { day: '-', month: '-' };
    return { day: d.getDate(), month: d.toLocaleDateString('en-US', { month: 'short' }) };
  };

  const filteredTransactions = dashboardData?.recentTransactions.filter(tx => {
     if (!dateRange.start && !dateRange.end) return true;
     const txDate = new Date(tx.date).setHours(0,0,0,0), start = dateRange.start ? new Date(dateRange.start).setHours(0,0,0,0) : null, end = dateRange.end ? new Date(dateRange.end).setHours(0,0,0,0) : null;
     if (start && txDate < start) return false; if (end && txDate > end) return false; return true;
  }) || [];

  const handleExportCSV = () => {
      if (!filteredTransactions.length) return;
      const csv = ['Receipt No,Date,Student Name,Admission No,Class,Mode,Amount,Remarks', ...filteredTransactions.map(tx => [tx.receiptNo || '-', new Date(tx.date).toLocaleDateString(), `"${tx.studentName}"`, tx.admissionNo, tx.studentClass, tx.mode, tx.amount, `"${tx.remarks}"`].join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }), url = URL.createObjectURL(blob), link = document.createElement('a');
      link.href = url; link.setAttribute('download', `fees_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handlePrintReceipt = (tx: FeeTransaction) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const amountInWords = numToWords(tx.amount);
      const html = `<html><head><title>Receipt</title><style>body{font-family:sans-serif;padding:20px}.card{border:2px solid #000;padding:20px;max-width:800px;margin:auto}.header{text-align:center;border-bottom:2px solid #000;margin-bottom:20px}.school-name{color:#cc1f28;font-size:32px;font-weight:900}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:10px;text-align:left}</style></head><body><div class="card"><div class="header"><h1 class="school-name">WISDOM HERITAGE</h1><p> Ghadi Chowk, Vijaynagar | 0761-3598469</p></div><p><strong>Receipt No:</strong> ${tx.receiptNo} | <strong>Date:</strong> ${new Date(tx.date).toLocaleDateString()}</p><p><strong>Student Name:</strong> ${tx.studentName} | <strong>Class:</strong> ${tx.studentClass}</p><table><thead><tr><th>Description</th><th>Amount</th></tr></thead><tbody><tr><td>${tx.remarks || 'School Fee'}</td><td>₹ ${tx.amount}</td></tr></tbody></table><p><strong>Total (in words):</strong> ${amountInWords}</p><p style="margin-top:40px;text-align:right">Authorized Signature</p></div><script>window.print()</script></body></html>`;
      printWindow.document.write(html); printWindow.document.close();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f2f6fc] dark:bg-black relative transition-colors duration-200">
      <div className="bg-emerald-600 px-6 py-6 pb-12 rounded-b-[2.5rem] shadow-lg sticky top-0 z-50 shrink-0 w-full">
          <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-4">
                  <button onClick={onBack} className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors border border-white/10 active:scale-95"><ArrowLeftIcon className="w-5 h-5" /></button>
                  <h2 className="text-xl font-bold tracking-wide">Fees Collection</h2>
              </div>
              <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-4 h-10 rounded-xl transition-all shadow-md active:scale-95 font-bold text-xs ${showFilters ? 'bg-white text-emerald-600' : 'bg-white/20 text-white border border-white/10'}`}><FilterIcon className="w-4 h-4" /><span>Filters</span></button>
          </div>
      </div>

      <div className="w-full px-6 pb-48 flex flex-col gap-6 mt-8 relative z-10">
         {showFilters && (<div className="bg-white dark:bg-zinc-900 p-5 rounded-[1.5rem] shadow-soft border-none animate-in slide-in-from-top-2 space-y-4"><div className="grid grid-cols-2 gap-4"><div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase ml-1">From</label><input type="date" value={dateRange.start} onChange={(e) => setDateRange(p => ({...p, start: e.target.value}))} className="w-full bg-slate-50 dark:bg-zinc-800 border-none rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-white" /></div><div className="space-y-1.5"><label className="text-xs font-bold text-slate-400 uppercase ml-1">To</label><input type="date" value={dateRange.end} onChange={(e) => setDateRange(p => ({...p, end: e.target.value}))} className="w-full bg-slate-50 dark:bg-zinc-800 border-none rounded-xl px-3 py-2.5 text-sm font-bold text-slate-700 dark:text-white" /></div></div><div className="flex items-center justify-between pt-2"><button onClick={() => setDateRange({start: '', end: ''})} className="text-xs font-bold text-slate-400 hover:text-red-500">Reset</button><button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold active:scale-95">Export CSV</button></div></div>)}
         {loading ? <div className="flex justify-center py-20"><LoaderIcon className="w-10 h-10 animate-spin text-emerald-500" /></div> : (
            <><div className="relative w-full overflow-hidden bg-gradient-to-br from-emerald-500 to-emerald-700 dark:from-zinc-900 dark:to-zinc-950 dark:border dark:border-zinc-800 rounded-[2rem] p-6 shadow-glow text-white"><div className="relative z-10 flex flex-row items-center justify-between"><div className="flex flex-col gap-1"><div className="flex items-center gap-2 text-emerald-100 font-bold text-xs uppercase tracking-widest"><CalendarIcon className="w-4 h-4" /><span>This Month</span></div><h1 className="text-3xl font-bold tracking-tight">₹ {(dashboardData?.monthlyCollection || 0).toLocaleString('en-IN')}</h1></div><div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-sm"><BanknoteIcon className="w-6 h-6" /></div></div></div>
                <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-soft p-6 border-none transition-colors"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>Recent Transactions</h3></div>
                    {filteredTransactions.length > 0 ? (<div className="space-y-3">{filteredTransactions.map((tx, idx) => { const { day, month } = getDayAndMonth(tx.date); return (<div key={idx} onClick={() => setSelectedTransaction(tx)} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-zinc-950/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all gap-3 cursor-pointer group active:scale-[0.99] border-none shadow-sm"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-900 flex flex-col items-center justify-center shrink-0 text-emerald-600 font-bold shadow-sm"><span className="text-sm leading-none">{day}</span><span className="text-[9px] uppercase font-bold text-slate-400 leading-none mt-0.5">{month}</span></div><div><h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 truncate">{tx.studentName}</h4><div className="flex items-center gap-1.5 mt-0.5"><span className="text-[10px] font-bold text-slate-500">{tx.studentClass}</span><span className="w-0.5 h-0.5 rounded-full bg-slate-300"></span><span className="text-[9px] font-bold text-slate-400">#{tx.receiptNo || '-'}</span></div></div></div><div className="text-right shrink-0"><p className="text-sm font-bold text-emerald-600">₹ {tx.amount.toLocaleString('en-IN')}</p><p className="text-[9px] text-slate-400 font-bold uppercase">{tx.mode}</p></div></div>); })}</div>) : <div className="text-center py-10"><div className="w-16 h-16 bg-slate-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300"><BanknoteIcon className="w-8 h-8" /></div><p className="text-slate-400 font-medium">No transactions found.</p></div>}
                </div></>
         )}
      </div>
      <div className="fixed bottom-28 left-4 right-4 z-[60] md:bottom-8 md:right-8 md:left-auto md:w-auto"><button onClick={() => setSearchOpen(true)} className="w-full md:w-auto h-14 bg-emerald-500 rounded-2xl md:rounded-full shadow-xl text-white flex items-center justify-center gap-2 px-6 hover:scale-105 active:scale-95 hover:bg-emerald-600"><BanknoteIcon className="w-5 h-5 md:w-6 md:h-6" /><span className="font-bold tracking-wide text-base">Collect Fees</span></button></div>
      {selectedTransaction && (<div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"><div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border-none"><div className="relative bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-center text-white"><button onClick={() => setSelectedTransaction(null)} className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white"><XIcon className="w-5 h-5" /></button><div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3"><SchoolIcon className="w-6 h-6" /></div><h3 className="text-lg font-bold">Fee Receipt</h3>{selectedTransaction.receiptNo && (<p className="text-emerald-100 text-sm font-mono mt-1 opacity-90">#{selectedTransaction.receiptNo}</p>)}</div><div className="p-6 space-y-6"><div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 rounded-2xl"><p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p><p className="text-3xl font-black text-slate-900 dark:text-white">₹ {selectedTransaction.amount.toLocaleString()}</p></div><div className="space-y-3"><div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-zinc-800"><span className="text-xs font-bold text-slate-400 uppercase">Date</span><span className="text-sm font-bold text-slate-700 dark:text-white">{new Date(selectedTransaction.date).toLocaleDateString()}</span></div><div className="flex justify-between items-center py-2 border-b border-slate-50 dark:border-zinc-800"><span className="text-xs font-bold text-slate-400 uppercase">Student</span><span className="text-sm font-bold text-slate-700 dark:text-white">{selectedTransaction.studentName}</span></div></div><div className="grid grid-cols-2 gap-3 pt-2"><button onClick={() => handlePrintReceipt(selectedTransaction)} className="flex items-center justify-center gap-2 h-12 bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-white rounded-xl font-bold text-sm">Print</button><button onClick={() => navigator.share && navigator.share({title:'Receipt',text:`${selectedTransaction.studentName}: ₹${selectedTransaction.amount}`})} className="flex items-center justify-center gap-2 h-12 bg-emerald-500 text-white rounded-xl font-bold text-sm">Share</button></div></div></div></div>)}
      <StudentSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} onSelect={handleStudentSelect} title="Find Student to Collect Fee" />
      {selectedStudent && <CollectFeesModal isOpen={feesModalOpen} onClose={() => { setFeesModalOpen(false); setSelectedStudent(null); handleFeeCollected(); }} student={selectedStudent} />}
    </div>
  );
};