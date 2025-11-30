import React from 'react';
import { Dialog, DialogContent, DialogTitle } from './dialog';
import Button from './button';

const ConfirmDialog = ({ open, title, description, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Hủy' }) => {
  return (
    <Dialog open={open} onOpenChange={v => !v && onCancel()}>
      <DialogContent>
        <DialogTitle>{title}</DialogTitle>
        <div className="my-4 text-gray-700">{description}</div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50" onClick={onCancel}>{cancelText}</Button>
          <Button variant="default" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={onConfirm}>{confirmText}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
