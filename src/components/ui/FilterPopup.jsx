import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function FilterPopup({ isOpen, onClose, filters, onApply, divisiList = [] }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    if (isOpen) setLocal(filters);
  }, [filters, isOpen]);

  if (!isOpen) return null;

  const update = (key, value) => setLocal(prev => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Filter Surat</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-md transition">
            <X size={20} />
          </button>
        </div>

        {/* Tanggal */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Urutkan Waktu</h3>
          <div className="flex gap-2">
            {['terbaru', 'terlama'].map(opt => (
              <button
                key={opt}
                onClick={() => update('tanggal', opt)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors flex-1 ${
                  local.tanggal === opt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                {opt === 'terbaru' ? 'Terbaru' : 'Terlama'}
              </button>
            ))}
          </div>
        </div>

        {/* Divisi */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Berdasarkan Divisi</h3>
          <div className="flex gap-2 mb-3">
            {['pengirim', 'tujuan'].map(opt => (
              <button
                key={opt}
                onClick={() => update('divisiType', opt)}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors flex-1 ${
                  local.divisiType === opt
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                {opt === 'pengirim' ? 'Div. Pengirim' : 'Div. Tujuan'}
              </button>
            ))}
          </div>
          <select
            value={local.divisi}
            onChange={e => update('divisi', e.target.value)}
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          >
            <option value="">-- Semua Divisi --</option>
            {divisiList.map(div => (
              <option key={div.id} value={div.id}>{div.nama_divisi}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Status Surat</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'dikirim', label: 'Sedang Dikirim' },
              { value: 'diterima', label: 'Diterima' }
            ].map(s => (
              <button
                key={s.value}
                onClick={() => update('status', s.value)}
                className={`px-4 py-2 rounded-full text-xs font-semibold border transition-colors ${
                  local.status === s.value
                    ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setLocal({ tanggal: 'terbaru', divisiType: 'pengirim', divisi: '', status: '' })}
            className="flex-1 py-2.5 font-medium border border-slate-300 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => onApply(local)}
            className="flex-1 py-2.5 font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
          >
            Terapkan Filter
          </button>
        </div>
      </div>
    </div>
  );
}
