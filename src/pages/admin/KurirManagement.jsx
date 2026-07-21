import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import Dialog from '../../components/ui/Dialog';

export default function KurirManagement() {
  const [kurirList, setKurirList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    fetchKurir();
  }, []);

  const fetchKurir = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.getKurir();
      if (error) throw new Error(error);
      setKurirList(data ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionConfirm = async () => {
    if (!confirmDialog) return;

    try {
      if (confirmDialog.action === 'approve') {
        const { error } = await api.approveKurir(confirmDialog.id);
        if (error) throw new Error(error);
      } else {
        const { error } = await api.deactivateKurir(confirmDialog.id);
        if (error) throw new Error(error);
      }
      fetchKurir();
    } catch (err) {
    setError(err.message);
    } finally {
      setConfirmDialog(null);
    }
  };

  if (loading) {
    return (
    <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manajemen Kurir</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola akun kurir dan persetujuan akses</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
 {error}
        </div>
  )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daftar Kurir</h2>
    </div>
        <div className="overflow-x-auto">
      <table className="w-full">
     <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
     <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
      </tr>
       </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {kurirList.map((kurir) => (
        <tr key={kurir.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
          <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-50">{kurir.nama_lengkap}</td>
       <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{kurir.email}</td>
 <td className="px-6 py-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
  kurir.status === 'approved' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
       : kurir.status === 'pending'
     ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
     : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
             }`}>
        {kurir.status === 'approved' ? 'Disetujui' : kurir.status === 'pending' ? 'Pending' : 'Nonaktif'}
    </span>
           </td>
         <td className="px-6 py-4 text-sm space-x-2">
  {kurir.status === 'pending' && (
          <button
       onClick={() => setConfirmDialog({ id: kurir.id, name: kurir.nama_lengkap, action: 'approve' })}
              className="text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
          >
   Approve
       </button>
                  )}
         {kurir.status === 'approved' && (
            <button
           onClick={() => setConfirmDialog({ id: kurir.id, name: kurir.nama_lengkap, action: 'nonaktif' })}
            className="text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
     >
          Nonaktifkan
   </button>
            )}
    </td>
       </tr>
              ))}
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
