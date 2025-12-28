
import React, { useState, useEffect } from 'react';
import { Student, FeeSummary } from '../types';
import { BanknoteIcon, LoaderIcon, CheckCircleIcon } from './Icons';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from './StudentActionModals';

export const CollectFeesModal: React.FC<{ isOpen: boolean; onClose: () => void; student: Student; onSuccess?: () => void }> = ({ isOpen, onClose, student, onSuccess }) => {
  const [data, setData] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('Cash');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successState, setSuccessState] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
      setSuccessState(false);
      setAmount('');
      setRemarks('');
    }
  }, [isOpen, student.admissionNo]);

  const loadData = async () => {
    setLoading(true);
    const res = await sheetApi.getStudentFees(student.admissionNo, student.totalFees);
    if (res.success && res.data) setData(res.data);
    setLoading(false);
  };

  const handlePayment = async () => {
    if (!amount) return;
    setSubmitting(true);
    const res = await sheetApi.collectFee(student.admissionNo, Number(amount), mode, remarks || 'School Fee Payment');
    if (res.success) {
      setSuccessState(true);
      if (onSuccess) onSuccess();
    } else alert("Failed to collect fee.");
    setSubmitting(false);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Collect Fees" icon={<BanknoteIcon className="w-6 h-6" />}>
      {loading ? (
        <div className="flex justify-center p-8"><LoaderIcon className="w-8 h-8 animate-spin text-indigo-600" /></div>
      ) : successState ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-6">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-600 mb-2 border dark:border-emerald-800"><CheckCircleIcon className="w-10 h-10" /></div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Successful!</h3>
            <div className="w-full grid grid-cols-2 gap-3 pt-4">
                <Button variant="secondary" onClick={() => { setSuccessState(false); loadData(); }} className="h-14">Collect More</Button>
                <Button variant="outline" onClick={onClose} className="h-14">Close</Button>
            </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-100">
            <p className="text-xs font-bold uppercase opacity-60 tracking-wider">Pending Dues</p>
            <p className="text-3xl font-bold mt-1">₹ {(data?.dueFees || 0).toLocaleString()}</p>
            {data && data.paidFees > 0 && <p className="text-sm mt-2 opacity-80 font-medium">Paid: ₹ {data.paidFees.toLocaleString()}</p>}
          </div>
          <div className="space-y-4">
            <Input label="Amount to Collect" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Payment Mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full h-12 px-4 bg-slate-50 dark:bg-[#1e293b] border-none rounded-2xl outline-none font-medium dark:text-white">
                  <option>Cash</option><option>UPI / Online</option><option>Cheque</option>
                </select>
            </div>
            <Input label="Remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional notes..." />
            <Button fullWidth onClick={handlePayment} isLoading={submitting} disabled={!amount} className="h-14 text-base">Record Payment</Button>
          </div>
        </div>
      )}
    </BaseModal>
  );
};
