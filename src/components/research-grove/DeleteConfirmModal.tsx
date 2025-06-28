import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Mandate } from '@/lib/models/mandate';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mandate: Mandate | null;
  isLoading?: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mandate,
  isLoading = false
}) => {
  if (!mandate) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <AlertDialogTitle className="text-left">
                Delete Research Mandate
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left">
            Are you sure you want to delete the mandate "{mandate.title}"? 
            This action will permanently remove the mandate and all associated research sources. 
            This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="bg-gray-50 p-4 rounded-lg my-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Client:</span>
              <span className="text-gray-900">{mandate.clientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Legal Area:</span>
              <span className="text-gray-900">{mandate.legalArea}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-600">Priority:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                mandate.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                mandate.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                mandate.priority === 'Medium' ? 'bg-blue-100 text-blue-800' :
                'bg-green-100 text-green-800'
              }`}>
                {mandate.priority}
              </span>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isLoading ? 'Deleting...' : 'Delete Mandate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}; 