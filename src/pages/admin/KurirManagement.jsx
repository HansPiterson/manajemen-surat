import React, { useEffect, useState } from 'react';
import { Add01Icon, Cancel01Icon } from 'hugeicons-react';
import { Link2, QrCode, UserRoundCheck } from 'lucide-react';
import { api } from '../../lib/api';
import Dialog from '../../components/ui/Dialog';
import Skeleton from '../../components/ui/Skeleton';

function StatusBadge({ status }) {
  const classes = status === 'approved'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    : status === 'pending'
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  const label = status === 'approved' ? 'Disetujui' : status === 'pending' ? 'Pending' : 'Nonaktif';

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${classes}`}>{label}</span>;
}

function PairingSummary({ user }) {
  if (user.role === 'divisi') {
    return user.assigned_kurir_nama ? (
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{user.assigned_kurir_nama}</p>
        <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">Terhubung melalui QR TU</p>
      </div>
    ) : (
      <span className="text-sm text-slate-400">Belum menghubungkan kurir</span>
    );
  }

  if (user.role === 'kurir') {
    return user.assigned_tu_nama ? (
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{user.assigned_tu_nama}</p>
        <p className="mt-0.5 text-xs text-slate-500">{user.assigned_divisi_nama || 'Divisi belum tersedia'}</p>
      </div>
    ) : (
      <span className="text-sm text-slate-400">Belum terhubung ke TU</span>
    );
  }

  return <span className="text-sm text-slate-400">-</span>;
}

export default function KurirManagement() {
  const [userList, setUserList] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    nama_lengkap: '',
    role: 'kurir',
    divisi_id: '',
  });

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error: requestError } = await api.getKurir();
    if (requestError) setError(requestError);
    else {
      setUserList(data ?? []);
      setError(null);
    }
    setLoading(false);
  };

  const fetchDivisi = async () => {
    const { data, error: requestError } = await api.getDivisi();
    if (!requestError) setDivisiList(data ?? []);
  };

  useEffect(() => {
    fetchUsers();
    fetchDivisi();
  }, []);

  const handleActionConfirm = async () => {
    if (!confirmDialog) return;

    const request = confirmDialog.action === 'approve'
      ? api.approveKurir(confirmDialog.id)
      : api.deactivateKurir(confirmDialog.id);
    const { error: requestError } = await request;
    if (requestError) setError(requestError);
    else await fetchUsers();
    setConfirmDialog(null);
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.nama_lengkap) {
      setError('Email, password, dan nama lengkap harus diisi');
      return;
    }
    if (newUser.role === 'divisi' && !newUser.divisi_id) {
      setError('Pilih divisi untuk user Tata Usaha');
      return;
    }

    setSaving(true);
    const payload = {
      email: newUser.email,
      password: newUser.password,
      nama_lengkap: newUser.nama_lengkap,
      role: newUser.role,
      ...(newUser.role === 'divisi' ? { divisi_id: newUser.divisi_id } : {}),
    };
    const { error: requestError } = await api.createUser(payload);

    if (requestError) {
      setError(requestError);
    } else {
      setNewUser({ email: '', password: '', nama_lengkap: '', role: 'kurir', divisi_id: '' });
      setShowAddUserDialog(false);
      setError(null);
      await fetchUsers();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Manajemen Pengguna</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-400">Kelola akun dan pantau koneksi Tata Usaha dengan kurir</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddUserDialog(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white transition hover:bg-blue-700"
        >
          <Add01Icon className="h-5 w-5" />
          Tambah User
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm leading-6 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-200">
        <QrCode className="mt-0.5 h-5 w-5 shrink-0" />
        <p>Admin hanya menyetujui dan memantau akun. Kurir penanggung jawab dihubungkan langsung oleh masing-masing akun Tata Usaha melalui menu <strong>Hubungkan Kurir</strong> dan scan QR pada aplikasi kurir.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 lg:hidden">
        {userList.map((user) => (
          <article key={user.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 dark:text-slate-50">{user.nama_lengkap}</p>
                <p className="mt-1 truncate text-sm text-slate-500">{user.email}</p>
              </div>
              <StatusBadge status={user.status} />
            </div>
            <div className="mt-4 grid gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-900/50 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Role & Divisi</p>
                <p className="mt-1 capitalize text-slate-700 dark:text-slate-200">{user.role} · {user.divisi_nama || user.assigned_divisi_nama || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Koneksi</p>
                <div className="mt-1"><PairingSummary user={user} /></div>
              </div>
            </div>
            {user.role === 'kurir' && (
              <div className="mt-4 flex justify-end">
                {user.status === 'pending' && (
                  <button type="button" onClick={() => setConfirmDialog({ id: user.id, name: user.nama_lengkap, action: 'approve' })} className="font-semibold text-green-600">Approve</button>
                )}
                {user.status === 'approved' && (
                  <button type="button" onClick={() => setConfirmDialog({ id: user.id, name: user.nama_lengkap, action: 'nonaktif' })} className="font-semibold text-red-600">Nonaktifkan</button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800 lg:block">
        <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Daftar Pengguna</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                {['Nama', 'Email', 'Role', 'Divisi', 'Koneksi TU / Kurir', 'Status', 'Aksi'].map((heading) => (
                  <th key={heading} className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {userList.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-900 dark:text-slate-50">{user.nama_lengkap}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.email}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm capitalize text-slate-600 dark:text-slate-400">{user.role}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{user.divisi_nama || user.assigned_divisi_nama || '-'}</td>
                  <td className="min-w-56 px-6 py-4 text-sm"><PairingSummary user={user} /></td>
                  <td className="whitespace-nowrap px-6 py-4"><StatusBadge status={user.status} /></td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm">
                    {user.role === 'kurir' && user.status === 'pending' && (
                      <button type="button" onClick={() => setConfirmDialog({ id: user.id, name: user.nama_lengkap, action: 'approve' })} className="font-semibold text-green-600 hover:text-green-700">Approve</button>
                    )}
                    {user.role === 'kurir' && user.status === 'approved' && (
                      <button type="button" onClick={() => setConfirmDialog({ id: user.id, name: user.nama_lengkap, action: 'nonaktif' })} className="font-semibold text-red-600 hover:text-red-700">Nonaktifkan</button>
                    )}
                    {(user.role !== 'kurir' || user.status === 'nonaktif') && <span className="text-slate-400">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddUserDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <UserRoundCheck className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Tambah User Baru</h3>
              </div>
              <button type="button" onClick={() => setShowAddUserDialog(false)} className="text-slate-400 transition hover:text-slate-600">
                <Cancel01Icon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                <input type="text" value={newUser.nama_lengkap} onChange={(event) => setNewUser({ ...newUser, nama_lengkap: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Nama lengkap" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                <input type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="email@example.com" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                <input type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} minLength={6} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white" placeholder="Minimal 6 karakter" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                <select value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value, divisi_id: '' })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                  <option value="kurir">Kurir</option>
                  <option value="divisi">Tata Usaha / Divisi</option>
                </select>
              </div>
              {newUser.role === 'divisi' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Divisi</label>
                  <select value={newUser.divisi_id} onChange={(event) => setNewUser({ ...newUser, divisi_id: event.target.value })} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-white">
                    <option value="">-- Pilih Divisi --</option>
                    {divisiList.map((divisi) => <option key={divisi.id} value={divisi.id}>{divisi.nama}</option>)}
                  </select>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Link2 className="h-3.5 w-3.5" /> Kurir dihubungkan oleh TU setelah akun dibuat.</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 border-t border-slate-200 px-6 py-4 dark:border-slate-700">
              <button type="button" onClick={handleAddUser} disabled={saving} className="flex-1 rounded-lg bg-blue-600 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              <button type="button" onClick={() => setShowAddUserDialog(false)} className="flex-1 rounded-lg bg-slate-200 py-2 font-semibold text-slate-900 transition hover:bg-slate-300 dark:bg-slate-700 dark:text-white">Batal</button>
            </div>
          </div>
        </div>
      )}

      <Dialog
        isOpen={Boolean(confirmDialog)}
        title={confirmDialog?.action === 'approve' ? 'Approve Kurir' : 'Nonaktifkan Kurir'}
        message={confirmDialog?.action === 'approve' ? `Izinkan akses untuk "${confirmDialog?.name}"?` : `Nonaktifkan akun "${confirmDialog?.name}" dan putuskan pairing TU aktifnya?`}
        type={confirmDialog?.action === 'approve' ? 'confirm' : 'alert'}
        confirmText="Ya, Lanjutkan"
        cancelText="Batal"
        onConfirm={handleActionConfirm}
        onClose={() => setConfirmDialog(null)}
      />
    </div>
  );
}
