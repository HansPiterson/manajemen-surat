import React, { useState, useEffect } from 'react';
import { useSSE } from '../../hooks/useSSE';
import { formatDate } from '../../lib/utils';
import { api } from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import { InformationCircleIcon, Cancel01Icon, PlusSignIcon } from 'hugeicons-react';

const truncateText = (text, maxLength = 12) => {
  if (!text) return '-';
  return text.length > maxLength ? text.slice(0, maxLength) + '..' : text;
};

export default function DivisiDashboard() {
  useSSE((event) => {
    if (event === 'surat_created' || event === 'surat_updated') {
      fetchDashboardData();
    }
  });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [namaDivisi, setNamaDivisi] = useState('');
  const [error, setError] = useState(null);

  // Stats & Table state
  const [suratList, setSuratList] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [currentDivisiId, setCurrentDivisiId] = useState(null);

  // Modal & Form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    perihal: '',
    divisi_tujuan_id: '',
    nama_penerima: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchDivisi();
  }, []);

  const fetchDivisi = async () => {
    try {
      const { data, error } = await api.getDivisi();
      if (error) throw new Error(error);
      console.log('📋 Divisi list fetched:', data);
      setDivisiList(data || []);
    } catch (err) {
      console.error('❌ Error fetching divisi:', err);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: profile, error: profileError } = await api.getProfile();
      if (profileError) throw new Error(profileError);

      const divisiId = profile?.divisi_id;
      const divisiName = profile?.divisi?.nama || profile?.divisi?.nama_divisi || profile?.nama_divisi || profile?.nama || '';
      setNamaDivisi(divisiName);
      setCurrentDivisiId(divisiId);

      const { data: suratData, error: suratError } = await api.getSurat({});
      if (suratError) throw new Error(suratError);

      const list = suratData || [];
      setSuratList(list);

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfDay);
      startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      setStats({
        total: list.length,
        today: list.filter(s => new Date(s.tanggal_surat || s.created_at) >= startOfDay).length,
        week: list.filter(s => new Date(s.tanggal_surat || s.created_at) >= startOfWeek).length,
        month: list.filter(s => new Date(s.tanggal_surat || s.created_at) >= startOfMonth).length,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!currentDivisiId) {
      setError("Data divisi pengirim tidak ditemukan.");
      return;
    }

    setFormLoading(true);
    setError(null);
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const nomor_surat = `EKS-${dateStr}-${randomId}`;

      const { error: createError } = await api.createSurat({
        nomor_surat,
        perihal: formData.perihal,
        tanggal_surat: new Date(),
        status: 'draft',
        divisi_pengirim_id: currentDivisiId,
        divisi_tujuan_id: formData.divisi_tujuan_id,
        nama_penerima: formData.nama_penerima || null
      });

      if (createError) throw new Error(createError);
      
      setShowCreateModal(false);
      setFormData({ perihal: '', divisi_tujuan_id: '', nama_penerima: '' });
      fetchDashboardData();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'draft':
        return <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">Draft</span>;
      case 'dikirim':
        return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/20">Dikirim</span>;
      case 'diterima':
        return <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-500/20">Sync</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Dashboard Divisi {namaDivisi ? `(${namaDivisi})` : ''}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Pantau surat masuk dan keluar khusus untuk divisi Anda.</p>
        </div>
        <div>
          <button 
            onClick={() => {
              console.log('🔵 Opening modal, current divisiList:', divisiList);
              fetchDivisi(); // Force reload divisi when modal opens
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
          >
            <PlusSignIcon size={18} />
            <span>Buat Surat Baru</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Surat Hari Ini</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.today}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Surat Minggu Ini</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.week}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Surat Bulan Ini</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.month}</p>
          </div>
        </div>
      )}

      {/* Letters List Section below stats */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Surat Divisi Terbaru</h2>
        
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
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                      <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-md" /></td>
                    </tr>
                  ))
                ) : suratList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                      Belum ada surat yang terdaftar untuk divisi ini.
                    </td>
                  </tr>
                ) : (
                  suratList.slice(0, 5).map((surat) => (
                    <tr key={surat.uuid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100" title={surat.nomor_surat}>
                        {truncateText(surat.nomor_surat, 12)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300" title={surat.pengirim_nama || '-'}>
                        {truncateText(surat.pengirim_nama || '-', 15)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300" title={surat.tujuan_nama || '-'}>
                        {truncateText(surat.tujuan_nama || '-', 15)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 max-w-xs truncate" title={surat.perihal}>
                        {truncateText(surat.perihal, 20)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(surat.tanggal_surat || surat.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm hide-on-print">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Buat Surat Baru (Draft)</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Cancel01Icon size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Perihal Surat *</label>
                <input
                  type="text"
                  name="perihal"
                  value={formData.perihal}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Misal: Dokumen Penawaran"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Divisi Tujuan *</label>
                <select
                  name="divisi_tujuan_id"
                  value={formData.divisi_tujuan_id}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ colorScheme: 'light dark' }}
                >
                  <option value="" style={{ backgroundColor: 'white', color: 'black' }}>-- Pilih Divisi --</option>
                  {divisiList.map(div => (
                    <option key={div.id} value={div.id} style={{ backgroundColor: 'white', color: 'black' }}>{div.nama}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">📋 {divisiList.length} divisi tersedia</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Penerima</label>
                <input
                  type="text"
                  name="nama_penerima"
                  value={formData.nama_penerima}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Opsional"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-md font-medium transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
