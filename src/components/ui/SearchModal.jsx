import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from '@tanstack/react-router';

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    const onEsc = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    
    const debounce = setTimeout(async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('surat_ekspedisi')
        .select('uuid, nomor_surat, perihal, status, tanggal_surat')
        .or(`nomor_surat.ilike.%${query}%,perihal.ilike.%${query}%`)
        .order('tanggal_surat', { ascending: false })
        .limit(10);
        
      if (!error) {
        setResults(data || []);
      }
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(debounce);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/50 backdrop-blur-sm flex items-start justify-center pt-20"
         onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200"
           onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-800">
          <Search size={22} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari nomor surat atau perihal..."
            className="flex-1 outline-none text-lg bg-transparent text-slate-900 dark:text-slate-50 placeholder-slate-400"
          />
          {loading && <span className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin shrink-0"></span>}
          <button onClick={onClose} className="p-1.5 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query && results.length === 0 && !loading && (
            <p className="p-8 text-center text-slate-500 dark:text-slate-400">Tidak ada hasil yang ditemukan untuk "{query}"</p>
          )}
          {results.map(s => (
            <div 
              key={s.uuid} 
              onClick={() => {
                onClose();
                sessionStorage.setItem('highlightSuratId', s.uuid);
                window.dispatchEvent(new CustomEvent('highlight-surat', { detail: s.uuid }));
                navigate({ to: '/admin/surat' });
              }}
              className="p-3 m-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-slate-900 dark:text-slate-100">{s.nomor_surat}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {s.status}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-1">{s.perihal}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
