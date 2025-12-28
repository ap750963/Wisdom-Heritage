import React, { useState } from 'react';
import { BaseModal } from './StudentActionModals';
import { Button } from './Button';
import { Input } from './Input';
import { LockIcon, CheckCircleIcon } from './Icons';
import { sheetApi } from '../services/SheetApi';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, username }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword === oldPassword) {
      setError("New password must be different from the old password.");
      return;
    }
    if (newPassword.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
    }

    setLoading(true);
    try {
      const res = await sheetApi.updatePassword(username, oldPassword, newPassword);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            onClose();
        }, 1500);
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Change Password" icon={<LockIcon className="w-6 h-6" />}>
        {success ? (
            <div className="flex flex-col items-center justify-center py-10 animate-in zoom-in-95">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                    <CheckCircleIcon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Password Updated!</h3>
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
                        {error}
                    </div>
                )}
                
                <Input 
                    type="password"
                    label="Current Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    icon={<LockIcon />}
                />
                
                <div className="space-y-4 pt-2">
                    <Input 
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        icon={<LockIcon />}
                    />
                    <Input 
                        type="password"
                        label="Retype New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        icon={<LockIcon />}
                    />
                </div>

                <div className="pt-4">
                    <Button type="submit" fullWidth isLoading={loading} className="h-14">Update Password</Button>
                </div>
            </form>
        )}
    </BaseModal>
  );
};