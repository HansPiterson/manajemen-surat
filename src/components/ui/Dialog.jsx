import React from 'react';
import { X, HelpCircle, AlertTriangle, Info } from 'lucide-react';

export default function Dialog({
  isOpen,
  title,
  message,
  type = 'confirm', // 'confirm' or 'alert' or 'info'
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="text-red-500 h-10 w-10 shrink-0" />;
      case 'info':
        return <Info className="text-blue-500 h-10 w-10 shrink-0" />;
      default:
        return <HelpCircle className="text-blue-600 dark:text-blue-400 h-10 w-10 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            {title || 'Perhatian'}
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex items-start gap-4">
          {getIcon()}
          <div className="space-y-1">
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-900/40 px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2.5">
          {type === 'confirm' && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-250 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
              type === 'alert' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {type === 'info' ? 'Tutup' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
