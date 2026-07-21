import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import { api } from '../../lib/api';
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

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        // API doesn't support search by nomor_surat yet, so we fetch all and filter client-side
        // This is a temporary solution until we add search endpoint to backend
        const { data: allSurat, error: searchError } = await api.getSurat();
        if (searchError) throw new Error(searchError);
        const filtered = allSurat.filter(s => 
          s.nomor_surat.toLowerCase().includes(query.toLowerCase()) ||
          s.perihal.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered.slice(0, 10));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleSelect = (surat) => {
    onClose();
    sessionStorage.setItem('highlightSuratId', surat.uuid);
    navigate({ to: '/admin/surat' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <Search size={20} className="text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari nomor surat atau perihal..."
            className="flex-1 bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading && (
            <div className="px-5 py-8 text-center text-slate-400">
              Mencari...
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <div className="px-5 py-8 text-center text-slate-400">
              Tidak ada hasil untuk "{query}"
            </div>
          )}

          {!loading && results.map(s => (
            <div
              key={s.uuid}
              onClick={() => handleSelect(s)}
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
