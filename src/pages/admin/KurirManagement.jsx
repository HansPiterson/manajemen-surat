import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import Dialog from '../../components/ui/Dialog';
import { Add01Icon, Cancel01Icon } from 'hugeicons-react';

export default function KurirManagement() {
  const [kurirList, setKurirList] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [savingAssignmentId, setSavingAssignmentId] = useState(null);

  // Form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nama_lengkap: '',
    role: 'kurir',
    divisi_id: '',
    assigned_kurir_id: ''
  });

  useEffect(() => {
    fetchKurir();
    fetchDivisi();
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

  const fetchDivisi = async () => {
    try {
      const { data, error } = await api.getDivisi();
      if (error) throw new Error(error);
      setDivisiList(data ?? []);
    } catch (err) {
      console.error('Error fetching divisi:', err);
    }
  };

  const handleAssignmentChange = async (userId, assignedKurirId) => {
    setSavingAssignmentId(userId);
    try {
      const { error: updateError } = await api.updateUser(userId, {
        assigned_kurir_id: assignedKurirId || null
      });
      if (updateError) throw new Error(updateError);
      setError(null);
      await fetchKurir();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingAssignmentId(null);
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

  const handleAddUser = async () => {
    try {
      // Validate
      if (!newUser.email || !newUser.password || !newUser.nama_lengkap) {
        setError('Email, password, dan nama lengkap harus diisi');
        return;
      }

      if (newUser.role === 'divisi' && !newUser.divisi_id) {
        setError('Pilih divisi untuk user dengan role divisi');
        return;
      }

      const userData = {
        email: newUser.email,
        password: newUser.password,
        nama_lengkap: newUser.nama_lengkap,
        role: newUser.role,
        status: 'approved' // Auto-approve admin-created users
      };

      if (newUser.role === 'divisi') {
        userData.divisi_id = newUser.divisi_id;
        if (newUser.assigned_kurir_id) {
          userData.assigned_kurir_id = newUser.assigned_kurir_id;
        }
      }

      const { error } = await api.createUser(userData);
      if (error) throw new Error(error);

      // Reset form
      setNewUser({
        email: '',
        password: '',
        nama_lengkap: '',
        role: 'kurir',
        divisi_id: ''
      });
      setShowAddUserDialog(false);
      setError(null);
      fetchKurir();
    } catch (err) {
      setError(err.message);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manajemen Pengguna</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola akun pengguna dan persetujuan akses</p>
        </div>
        <button
          onClick={() => setShowAddUserDialog(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Add01Icon className="w-5 h-5" />
          Tambah User
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daftar Pengguna</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Divisi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kurir Penanggung Jawab</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {kurirList.map((kurir) => (
                <tr key={kurir.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-50">{kurir.nama_lengkap}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{kurir.email}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 capitalize">{kurir.role}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {kurir.divisi_nama || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {kurir.role === 'divisi' ? (
                      <select
                        value={kurir.assigned_kurir_id || ''}
                        disabled={savingAssignmentId === kurir.id}
                        onChange={(event) => handleAssignmentChange(kurir.id, event.target.value)}
                        className="min-w-52 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-wait disabled:opacity-60 dark:border-slate-600 dark:bg-slate-700 dark:text-white"
                      >
                        <option value="">Belum ditugaskan</option>
                        {kurirList
                          .filter((candidate) => candidate.role === 'kurir' && candidate.status === 'approved')
                          .map((candidate) => (
                            <option key={candidate.id} value={candidate.id}>
                              {candidate.nama_lengkap}
                            </option>
                          ))}
                      </select>
                    ) : (
                      '-'
                    )}
                  </td>
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

      {/* Add User Modal */}
      {showAddUserDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Tambah User Baru</h3>
              <button
                onClick={() => setShowAddUserDialog(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <Cancel01Icon className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={newUser.nama_lengkap}
                  onChange={(e) => setNewUser({ ...newUser, nama_lengkap: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nama lengkap"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimal 6 karakter"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value, divisi_id: '' })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="kurir">Kurir</option>
                  <option value="divisi">Divisi</option>
                </select>
              </div>

              {newUser.role === 'divisi' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Divisi
                    </label>
                    <select
                      value={newUser.divisi_id}
                      onChange={(e) => setNewUser({ ...newUser, divisi_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Pilih Divisi --</option>
                      {divisiList.map((div) => (
                        <option key={div.id} value={div.id}>
                          {div.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Kurir Penanggung Jawab (Opsional)
                    </label>
                    <select
                      value={newUser.assigned_kurir_id || ''}
                      onChange={(e) => setNewUser({ ...newUser, assigned_kurir_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Auto Pilih dari Divisi --</option>
                      {kurirList.filter(k => k.role === 'kurir').map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_lengkap} ({k.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex gap-3">
              <button
                onClick={handleAddUser}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors font-medium"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowAddUserDialog(false)}
                className="flex-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white py-2 rounded-lg transition-colors font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Dialog */}
      <Dialog
        isOpen={!!confirmDialog}
        title={confirmDialog?.action === 'approve' ? 'Approve Pengguna' : 'Nonaktifkan Pengguna'}
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
