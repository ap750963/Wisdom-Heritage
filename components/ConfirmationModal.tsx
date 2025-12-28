import React from 'react';
import { BaseModal } from './StudentActionModals';
import { Button } from './Button';
import { LoaderIcon } from './Icons';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isLoading = false,
}) => {
  return (
    <BaseModal 
        isOpen={isOpen} 
        onClose={onClose} 
        title={title} 
        icon={<LoaderIcon className="w-6 h-6 text-red-500" />} // Using LoaderIcon as a placeholder, ideally use AlertTriangle
    >
      <div className="space-y-6">
        <p className="text-slate-600 dark:text-slate-300 font-medium text-base leading-relaxed">
            {message}
        </p>

        <div className="flex gap-3 pt-2">
            <Button 
                variant="secondary" 
                fullWidth 
                onClick={onClose} 
                disabled={isLoading}
                className="h-14"
            >
                Cancel
            </Button>
            <Button 
                variant="danger" 
                fullWidth 
                onClick={onConfirm} 
                isLoading={isLoading}
                className="h-14 bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 border-transparent"
            >
                {confirmLabel}
            </Button>
        </div>
      </div>
    </BaseModal>
  );
};