import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import { Download01Icon, PrinterIcon } from 'hugeicons-react';

export default function DivisiSuratViewer() {
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  useEffect(() => {
    fetchSurat();
  }, []);

  const fetchSurat = async () => {
    setLoading(true);
    try {
      // Fetching surat data. RLS on Supabase will automatically filter this
      // so the division only sees their own letters (sent or received).
      const { data, error } = await supabase
        .from('surat_ekspedisi')
        .select(`
          id, 
          nomor_surat, 
          perihal, 
          tanggal_surat, 
          status,
          foto_bukti,
          foto_latitude,
          foto_longitude,
          foto_hash,
          needs_upload,
          divisi_pengirim:divisi_pengirim_id (nama_divisi),
          divisi_tujuan:divisi_tujuan_id (nama_divisi)
        `)
        .order('tanggal_surat', { ascending: false });

      if (error) throw error;
      setSuratList(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (suratList.length === 0) return;
    
    // Create CSV header
    const headers = ['Nomor Surat', 'Pengirim', 'Tujuan', 'Perihal', 'Tanggal', 'Status'];
    
    // Create CSV rows
    const rows = suratList.map(surat => [
      `"${surat.nomor_surat}"`,
      `"${surat.divisi_pengirim?.nama_divisi || ''}"`,
      `"${surat.divisi_tujuan?.nama_divisi || ''}"`,
      `"${surat.perihal}"`,
      `"${surat.tanggal_surat}"`,
      `"${surat.status}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    // Download Blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `laporan_surat_divisi_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'diterima':
        return <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-800 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">Diterima</span>;
      case 'dikirim':
        return <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-500/20 dark:bg-slate-900/50 dark:text-slate-400 dark:ring-slate-800">Dikirim</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/10 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 print-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Surat Masuk & Keluar</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 hide-on-print">Daftar surat ekspedisi yang berkaitan dengan divisi Anda.</p>
        </div>
        <div className="flex gap-2 hide-on-print">
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 px-4 py-2 rounded-md font-medium transition-colors"
          >
            <Download01Icon size={18} />
            <span>CSV</span>
          </button>
          <button 
            onClick={handlePrintPDF}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 px-4 py-2 rounded-md font-medium transition-colors"
          >
            <PrinterIcon size={18} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 font-medium whitespace-nowrap">Nomor Surat</th>
                <th className="px-6 py-4 font-medium">Pengirim</th>
                <th className="px-6 py-4 font-medium">Tujuan</th>
                <th className="px-6 py-4 font-medium">Perihal</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Tanggal</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                // Skeleton loading rows
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-md" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-md" /></td>
                  </tr>
                ))
              ) : suratList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Belum ada surat yang terdaftar untuk divisi ini.
                  </td>
                </tr>
              ) : (
                suratList.map((surat) => (
                  <tr key={surat.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{surat.nomor_surat}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{surat.divisi_pengirim?.nama_divisi || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{surat.divisi_tujuan?.nama_divisi || '-'}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 max-w-xs truncate" title={surat.perihal}>{surat.perihal}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{surat.tanggal_surat}</td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(surat.status)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
