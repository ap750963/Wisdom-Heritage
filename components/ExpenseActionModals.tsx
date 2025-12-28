
import React, { useState, useEffect } from 'react';
import { RupeeBillIcon, LoaderIcon, BanknoteIcon, BriefcaseIcon, SearchIcon, ArrowLeftIcon, UserIcon, ReceiptIcon } from './Icons';
import { Button } from './Button';
import { Input } from './Input';
import { sheetApi } from '../services/SheetApi';
import { BaseModal } from './StudentActionModals';
import { Expense, Employee } from '../types';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: { name: string } | null;
}

type ExpenseStep = 'CATEGORY' | 'EMPLOYEE' | 'FORM';

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  // State Machine
  const [step, setStep] = useState<ExpenseStep>('CATEGORY');
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

  // Data State
  const initialFormState: Expense = {
    date: getLocalDate(),
    receiptNumber: '', // Auto-filled
    title: '',
    category: '',
    amount: 0,
    paymentMode: 'Cash',
    approvedBy: user?.name || 'Admin',
    remarks: '',
    reference: ''
  };

  const [formData, setFormData] = useState<Expense>(initialFormState);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [fetchingEmployees, setFetchingEmployees] = useState(false);

  // Initialize
  useEffect(() => {
    if (isOpen) {
      setStep('CATEGORY');
      setFormData(initialFormState);
      setError('');
      setSearchQuery('');
    }
  }, [isOpen]);

  // Fetch Receipt Number when entering Form Step
  useEffect(() => {
    if (step === 'FORM') {
      const fetchReceipt = async () => {
        setLoading(true);
        try {
          const res = await sheetApi.getNextExpenseReceiptNumber();
          if (res.success && res.data) {
            setFormData(prev => ({ ...prev, receiptNumber: res.data! }));
          }
        } catch(e) {
          setError("Failed to generate receipt number.");
        } finally {
          setLoading(false);
        }
      };
      fetchReceipt();
    }
  }, [step]);

  // Fetch Employees if entering Employee Step
  useEffect(() => {
    if (step === 'EMPLOYEE' && employees.length === 0) {
      setFetchingEmployees(true);
      sheetApi.getEmployees().then(res => {
        if(res.success && res.data) setEmployees(res.data);
        setFetchingEmployees(false);
      });
    }
  }, [step]);

  // --- Handlers ---

  const handleCategorySelect = (category: string) => {
    setFormData(prev => ({ ...prev, category }));
    if (category === 'Salary') {
      setStep('EMPLOYEE');
    } else {
      setStep('FORM');
    }
  };

  const handleEmployeeSelect = (emp: Employee) => {
    setFormData(prev => ({
      ...prev,
      title: `Salary Payment - ${emp.name}`, // Auto-set title for Salary
      linkedEmployeeId: emp.employeeId,
      linkedEmployeeName: emp.name
    }));
    setStep('FORM');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.amount || formData.amount <= 0) {
        setError("Please enter a valid amount.");
        return;
    }
    if (!formData.receiptNumber) {
        setError("Receipt number missing. Please retry.");
        return;
    }
    if (formData.category === 'Salary' && !formData.linkedEmployeeId) {
        setError("No employee selected for salary.");
        return;
    }

    setLoading(true);

    try {
      const response = await sheetApi.addExpense({
          ...formData,
          amount: Number(formData.amount)
      });
      
      if (response.success) {
        onSuccess();
        onClose();
      } else {
        setError(response.message || "Failed to add expense");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  // --- Render Steps ---

  // 1. Category Selector
  if (step === 'CATEGORY') {
    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="New Expense Type" icon={<RupeeBillIcon className="w-6 h-6" />}>
        <div className="grid grid-cols-1 gap-4 pt-2">
           <button 
             onClick={() => handleCategorySelect('Purchase')}
             className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-all group text-left"
           >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-red-500 shadow-sm group-hover:scale-110 transition-transform">
                 <ReceiptIcon className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="text-base font-bold text-slate-900 group-hover:text-red-600">Purchase</h4>
                 <p className="text-xs text-slate-500 mt-0.5">Inventory, Supplies, Assets</p>
              </div>
           </button>

           <button 
             onClick={() => handleCategorySelect('Withdrawal')}
             className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-all group text-left"
           >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-orange-500 shadow-sm group-hover:scale-110 transition-transform">
                 <BanknoteIcon className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="text-base font-bold text-slate-900 group-hover:text-red-600">Withdrawal</h4>
                 <p className="text-xs text-slate-500 mt-0.5">Petty Cash, Bank Withdrawal</p>
              </div>
           </button>

           <button 
             onClick={() => handleCategorySelect('Salary')}
             className="flex items-center gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-red-50 hover:border-red-100 transition-all group text-left"
           >
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-purple-500 shadow-sm group-hover:scale-110 transition-transform">
                 <BriefcaseIcon className="w-6 h-6" />
              </div>
              <div>
                 <h4 className="text-base font-bold text-slate-900 group-hover:text-red-600">Salary</h4>
                 <p className="text-xs text-slate-500 mt-0.5">Staff Payment, Wages</p>
              </div>
           </button>
        </div>
      </BaseModal>
    );
  }

  // 2. Employee Search (Only for Salary)
  if (step === 'EMPLOYEE') {
    const filteredEmployees = employees.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);

    return (
      <BaseModal isOpen={isOpen} onClose={onClose} title="Select Employee" icon={<UserIcon className="w-6 h-6" />}>
         <div className="space-y-4 min-h-[300px]">
            <div className="flex items-center gap-2 mb-2">
                <button onClick={() => setStep('CATEGORY')} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <ArrowLeftIcon className="w-3 h-3" /> Back
                </button>
            </div>

            <div className="relative">
                <Input 
                    placeholder="Search name or ID..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    icon={<SearchIcon />}
                    autoFocus
                />
            </div>

            {fetchingEmployees ? (
                <div className="flex justify-center py-8"><LoaderIcon className="w-6 h-6 animate-spin text-red-500" /></div>
            ) : (
                <div className="space-y-2">
                    {filteredEmployees.map(emp => (
                        <button 
                            key={emp.employeeId}
                            onClick={() => handleEmployeeSelect(emp)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100 group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm group-hover:bg-white">
                                {emp.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-sm">{emp.name}</p>
                                <p className="text-xs opacity-70">{emp.post} • {emp.employeeId}</p>
                            </div>
                        </button>
                    ))}
                    {filteredEmployees.length === 0 && searchQuery && (
                        <p className="text-center text-slate-400 text-sm py-4">No employee found.</p>
                    )}
                </div>
            )}
         </div>
      </BaseModal>
    );
  }

  // 3. Main Form
  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={`Add ${formData.category}`} 
        icon={<RupeeBillIcon className="w-6 h-6" />}
    >
       <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded-xl font-medium">{error}</div>}
          
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
             <button type="button" onClick={() => setStep('CATEGORY')} className="text-xs font-bold text-slate-400 hover:text-red-500">Change Category</button>
             <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                 {loading && !formData.receiptNumber ? 'Generating...' : formData.receiptNumber || 'D--'}
             </div>
          </div>

          {/* Read-Only Context Fields */}
          {formData.category === 'Salary' && (
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-purple-500 shadow-sm">
                      <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                      <p className="text-xs font-bold text-purple-400 uppercase tracking-wide">Paying To</p>
                      <p className="text-sm font-bold text-purple-900">{formData.linkedEmployeeName}</p>
                      <p className="text-[10px] text-purple-700">{formData.linkedEmployeeId}</p>
                  </div>
              </div>
          )}

          <div className="space-y-4">
              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-600 uppercase ml-1">Purpose / Title *</label>
                 <Input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    placeholder={formData.category === 'Salary' ? "Salary Payment" : "e.g. Office Supplies"} 
                    // Make title editable even for Salary to add details like "March Salary"
                 />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-600 uppercase ml-1">Amount (₹) *</label>
                     <Input type="number" name="amount" value={formData.amount} onChange={handleChange} required />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-600 uppercase ml-1">Date *</label>
                     <input 
                        type="date" 
                        name="date" 
                        value={formData.date} 
                        onChange={handleChange} 
                        className="w-full h-12 px-4 bg-slate-100 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:bg-white outline-none" 
                        required 
                     />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-600 uppercase ml-1">Payment Mode *</label>
                     <select 
                        name="paymentMode" 
                        value={formData.paymentMode} 
                        onChange={handleChange}
                        className="w-full h-12 px-4 bg-slate-100 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:bg-white outline-none"
                     >
                        <option>Cash</option>
                        <option>Online / UPI</option>
                        <option>Cheque</option>
                        <option>Bank Transfer</option>
                     </select>
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-600 uppercase ml-1">Reference No.</label>
                     <Input name="reference" value={formData.reference} onChange={handleChange} placeholder="Optional (Txn ID)" />
                  </div>
              </div>

              <div className="space-y-1.5">
                 <label className="text-xs font-bold text-slate-600 uppercase ml-1">Remarks</label>
                 <textarea 
                    name="remarks" 
                    value={formData.remarks} 
                    onChange={handleChange} 
                    rows={2}
                    className="w-full p-3 bg-slate-100 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-red-500/20 focus:bg-white outline-none"
                    placeholder="Any additional notes..."
                 />
              </div>
          </div>

          <div className="pt-2 flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} fullWidth className="h-14">Cancel</Button>
            <Button 
                type="submit" 
                isLoading={loading} 
                fullWidth 
                disabled={loading || !formData.receiptNumber}
                className="h-14 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/25 border-transparent"
            >
                Confirm Expense
            </Button>
          </div>
       </form>
    </BaseModal>
  );
};
