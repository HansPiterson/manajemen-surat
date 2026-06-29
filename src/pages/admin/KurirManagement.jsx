import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import Dialog from '../../components/ui/Dialog';

export default function KurirManagement() {
  const [kurirList, setKurirList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState(null); // { id, name, action: 'approve' | 'nonaktif' }

  useEffect(() => {
    fetchKurir();
  }, []);

  const fetchKurir = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'kurir')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setKurirList(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionConfirm = async () => {
    if (!confirmDialog) return;
    try {
      const newStatus = confirmDialog.action === 'approve' ? 'approved' : 'nonaktif';
      
      const { error } = await supabase
        .from('users')
        .update({ status: newStatus })
        .eq('id', confirmDialog.id);
      
      if (error) throw error;
      
      setConfirmDialog(null);
      fetchKurir();
    } catch (err) {
      setError(err.message);
      setConfirmDialog(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">Approved</span>;
      case 'pending':
        return <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">Pending</span>;
      case 'nonaktif':
        return <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full text-xs font-medium">Nonaktif</span>;
      default:
        return <span className="px-2 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manajemen Kurir</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola pendaftaran dan status akun kurir.</p>
      </div>

      {error && <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">{error}</div>}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daftar Kurir</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-sm">
                <th className="px-6 py-3 font-medium">Nama Lengkap</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-6 py-4 flex justify-end gap-2">
                      <Skeleton className="h-8 w-20" />
                    </td>
                  </tr>
                ))
              ) : kurirList.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada kurir yang terdaftar.
                  </td>
                </tr>
              ) : (
                kurirList.map((kurir) => (
                  <tr key={kurir.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100">{kurir.nama_lengkap}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{kurir.email}</td>
                    <td className="px-6 py-4 text-sm">
                      {getStatusBadge(kurir.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      {kurir.status !== 'approved' && (
                        <button 
                          onClick={() => setConfirmDialog({ id: kurir.id, name: kurir.nama_lengkap, action: 'approve' })}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 font-medium px-2 py-1"
                        >
                          Approve
                        </button>
                      )}
                      {kurir.status !== 'nonaktif' && (
                        <button 
                          onClick={() => setConfirmDialog({ id: kurir.id, name: kurir.nama_lengkap, action: 'nonaktif' })}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium px-2 py-1"
                        >
                          Nonaktifkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog
        isOpen={!!confirmDialog}
        title={confirmDialog?.action === 'approve' ? 'Approve Kurir' : 'Nonaktifkan Kurir'}
        message={
          confirmDialog?.action === 'approve' 
            ? `Apakah Anda yakin ingin mengizinkan akses untuk "${confirmDialog?.name}"?` 
            : `Apakah Anda yakin ingin menonaktifkan akun "${confirmDialog?.name}"?`
        }
        type={confirmDialog?.action === 'approve' ? 'confirm' : 'alert'}
        confirmText="Ya, Lanjutkan"
        cancelText="Batal"
        onConfirm={handleActionConfirm}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
}
