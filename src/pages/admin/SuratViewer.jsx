import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSSE } from '../../hooks/useSSE';
import { useNavigate } from '@tanstack/react-router';
import { formatDate } from '../../lib/utils';
import { api } from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import FilterPopup from '../../components/ui/FilterPopup';
import Select from '../../components/ui/Select';
import Dialog from '../../components/ui/Dialog';
import { 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  FileText, 
  Image as ImageIcon,
  Calendar,
  User,
  Building,
  Plus,
  Filter
} from 'lucide-react';

const truncateText = (text, maxLength = 12) => {
  if (!text) return '-';
  return text.length > maxLength ? text.slice(0, maxLength) + '..' : text;
};

export default function SuratViewer() {
  const [suratList, setSuratList] = useState([]);
  const [filters, setFilters] = useState({
    tanggal: 'terbaru',
    divisiType: 'pengirim',
    divisi: '',
    status: ''
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [highlightId, setHighlightId] = useState(null);
  const [divisiList, setDivisiList] = useState([]);
  const navigate = useNavigate();

  const handleSSEEvent = useCallback((event, data) => {
    if (event === 'surat_created' || event === 'surat_updated') {
      fetchSurat();
    }
  }, []);
  useSSE(handleSSEEvent);


  useEffect(() => {
    const handleHighlight = (e) => {
      setHighlightId(e.detail);
      setTimeout(() => setHighlightId(null), 10000);
    };
    const stored = sessionStorage.getItem('highlightSuratId');
    if (stored) {
      setHighlightId(stored);
      sessionStorage.removeItem('highlightSuratId');
      setTimeout(() => setHighlightId(null), 10000);
    }
    window.addEventListener('highlight-surat', handleHighlight);
    return () => window.removeEventListener('highlight-surat', handleHighlight);
  }, []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals state
  const [editingSurat, setEditingSurat] = useState(null);   // For Edit Modal
  const [showCreateModal, setShowCreateModal] = useState(false); // For Create Modal
  const [deleteTarget, setDeleteTarget] = useState(null);   // For Custom Confirmation Dialog
  const [syncTarget, setSyncTarget] = useState(null);       // For Sync Confirmation Dialog
  
  const [formLoading, setFormLoading] = useState(false);
  
  // Forms state
  const [formData, setFormData] = useState({
    perihal: '',
    divisi_pengirim_id: '',
    divisi_tujuan_id: '',
    nama_penerima: '',
    status: 'draft'
  });



  useEffect(() => {
    fetchSurat();
    fetchDivisi();
  }, []);

  const fetchDivisi = async () => {
    try {
      const { data, error } = await api.getDivisi();
      if (error) throw new Error(error);
      setDivisiList(data || []);
    } catch (err) {
      console.error('Error fetching divisi:', err);
    }
  };

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const { data, error } = await api.getSurat();
      if (error) throw new Error(error);
      setSuratList(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const nomor_surat = `EKS-${dateStr}-${randomId}`;

      if (!formData.divisi_pengirim_id) {
        setError('Divisi pengirim wajib dipilih');
        setFormLoading(false);
        return;
      }
      if (!formData.divisi_tujuan_id) {
        setError('Divisi tujuan wajib dipilih');
        setFormLoading(false);
        return;
      }
      if (formData.divisi_pengirim_id === formData.divisi_tujuan_id) {
        setError('Divisi tujuan harus berbeda dari divisi pengirim');
        setFormLoading(false);
        return;
      }
      const { error: createError } = await api.createSurat({
        nomor_surat,
        perihal: formData.perihal,
        tanggal_surat: new Date().toISOString(),
        status: formData.status,
        divisi_pengirim_id: formData.divisi_pengirim_id,
        divisi_tujuan_id: formData.divisi_tujuan_id,
        nama_penerima: formData.nama_penerima || null
      });
      
      if (createError) throw new Error(createError);
      
      setShowCreateModal(false);
      resetForm();
      fetchSurat();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (surat) => {
    if (String(surat.status || '').toLowerCase().trim() === 'diterima') {
      setError('Surat dengan status "sync" bersifat permanen dan tidak dapat diedit.');
      return;
    }
    setEditingSurat(surat);
    setFormData({
      perihal: surat.perihal,
      divisi_pengirim_id: surat.divisi_pengirim_id || '',
      divisi_tujuan_id: surat.divisi_tujuan_id || '',
      nama_penerima: surat.nama_penerima || '',
      status: surat.status
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      if (editingSurat && String(editingSurat.status || '').toLowerCase().trim() === 'diterima') {
        setError('Surat dengan status "sync" bersifat permanen dan tidak dapat diubah.');
        setFormLoading(false);
        return;
      }

      if (String(formData.status).toLowerCase().trim() === 'diterima') {
        setSyncTarget({ uuid: editingSurat.uuid, newStatus: 'diterima', fromEditModal: true });
        setFormLoading(false);
        return;
      }

      if (formData.divisi_pengirim_id === formData.divisi_tujuan_id) {
        setError('Divisi tujuan harus berbeda dari divisi pengirim');
        setFormLoading(false);
        return;
      }

      await executeEditSubmit();
    } catch (err) {
      setError(err.message);
      setFormLoading(false);
    }
  };

  const executeEditSubmit = async () => {
    const { error: editError } = await api.updateSurat(editingSurat.uuid, {
      perihal: formData.perihal,
      divisi_pengirim_id: formData.divisi_pengirim_id || null,
      divisi_tujuan_id: formData.divisi_tujuan_id || null,
      nama_penerima: formData.nama_penerima || null,
      status: formData.status
    });

    if (editError) throw new Error(editError);

    setEditingSurat(null);
    resetForm();
    fetchSurat();
  };

  const handleSyncConfirm = async () => {
    if (!syncTarget) return;
    setFormLoading(true);
    try {
      if (syncTarget.fromEditModal) {
        await executeEditSubmit();
      }
      setSyncTarget(null);
    } catch (err) {
      setError(err.message);
      setSyncTarget(null);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const currentSurat = suratList.find(item => item.uuid === deleteTarget.uuid);
      if (currentSurat && String(currentSurat.status || '').toLowerCase().trim() === 'diterima') {
        setError('Surat dengan status "sync" bersifat permanen dan tidak dapat dihapus.');
        setDeleteTarget(null);
        return;
      }
      const { error: delError } = await api.deleteSurat(deleteTarget.uuid);
      if (delError) throw new Error(delError);
      setDeleteTarget(null);
      fetchSurat();
    } catch (err) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      perihal: '',
      divisi_pengirim_id: '',
      divisi_tujuan_id: '',
      nama_penerima: '',
      status: 'draft'
    });
  };

  // Map divisions to options for Select component
  const divisiOptions = divisiList.map(div => ({
    value: div.id,
    label: div.nama
  }));
  const tujuanDivisiOptions = divisiOptions.filter(
    option => option.value !== formData.divisi_pengirim_id
  );

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'dikirim', label: 'Dikirim' },
    { value: 'diterima', label: 'Sync (Diterima)' }
  ];

  const sortedSuratList = useMemo(() => {
    let result = [...suratList];

    if (filters.status) {
      result = result.filter(s => s.status === filters.status);
    }

    if (filters.divisi) {
      const field = filters.divisiType === 'pengirim' ? 'divisi_pengirim_id' : 'divisi_tujuan_id';
      result = result.filter(s => String(s[field]) === String(filters.divisi));
    }

    result.sort((a, b) => {
      const diff = new Date(b.tanggal_surat || b.created_at) - new Date(a.tanggal_surat || a.created_at);
      return filters.tanggal === 'terbaru' ? diff : -diff;
    });

    return result;
  }, [suratList, filters]);

  // Active filters count for badge
  const activeFiltersCount = Object.values(filters).filter(v => v !== '' && v !== 'terbaru' && v !== 'pengirim').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Surat Ekspedisi</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola, verifikasi, dan pantau aktivitas ekspedisi surat.</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-medium transition-colors whitespace-nowrap hover:bg-slate-50 dark:hover:bg-slate-800/80 relative"
          >
            <Filter size={18} className="shrink-0" />
            Filter Surat
            {activeFiltersCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-[10px] font-bold text-blue-600 dark:text-blue-400 ml-1">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap flex items-center gap-2"
          >
            <Plus size={20} />
            Buat Surat Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Table */}
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
                <th className="px-6 py-4 font-medium w-48">Status</th>
                <th className="px-6 py-4 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-8 w-24 rounded-md" /></td>
                    <td className="px-6 py-4 flex justify-center gap-2"><Skeleton className="h-8 w-24" /></td>
                  </tr>
                ))
              ) : sortedSuratList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Belum ada surat yang terdaftar.
                  </td>
                </tr>
              ) : (
                sortedSuratList.map((surat) => {
                  const isHighlight = highlightId === surat.uuid;
                  const isDiterima = String(surat.status || '').toLowerCase().trim() === 'diterima';
                  return (
                  <tr key={surat.uuid} className={`transition-all duration-1000 ease-in-out ${isHighlight ? 'bg-blue-600 dark:bg-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <td className={`px-6 py-4 text-sm font-medium transition-colors duration-1000 ${isHighlight ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`} title={surat.nomor_surat}>
                      {truncateText(surat.nomor_surat, 12)}
                    </td>
                    <td className={`px-6 py-4 text-sm transition-colors duration-1000 ${isHighlight ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`} title={surat.pengirim_nama || '-'}>
                      {truncateText(surat.pengirim_nama || '-', 15)}
                    </td>
                    <td className={`px-6 py-4 text-sm transition-colors duration-1000 ${isHighlight ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`} title={surat.tujuan_nama || '-'}>
                      {truncateText(surat.tujuan_nama || '-', 15)}
                    </td>
                    <td className={`px-6 py-4 text-sm max-w-xs truncate transition-colors duration-1000 ${isHighlight ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`} title={surat.perihal}>
                      {truncateText(surat.perihal, 20)}
                    </td>
                    <td className={`px-6 py-4 text-sm transition-colors duration-1000 ${isHighlight ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>{formatDate(surat.tanggal_surat || surat.created_at)}</td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      {surat.status === 'draft' && (
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-500/10">
                          Draft
                        </span>
                      )}
                      {surat.status === 'dikirim' && (
                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          Sedang Dikirim
                        </span>
                      )}
                      {isDiterima && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          Sync (Diterima)
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Preview / Detail Icon */}
                        <button 
                          onClick={() => navigate({ to: `/admin/surat/${surat.nomor_surat}` })}
                          className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Preview Detail Surat"
                        >
                          <Eye size={18} />
                        </button>
                        {/* Edit Icon */}
                        {!isDiterima && (
                          <button 
                            onClick={() => handleEditClick(surat)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Edit Surat"
                          >
                            <Pencil size={18} />
                          </button>
                        )}
                        {/* Delete Icon */}
                        {!isDiterima && (
                          <button 
                            onClick={() => setDeleteTarget({ uuid: surat.uuid, nomor_surat: surat.nomor_surat })}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                            title="Hapus Surat"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Buat Surat Baru</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perihal</label><textarea name="perihal" value={formData.perihal} onChange={e => setFormData({...formData, perihal: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Divisi Pengirim</label><Select options={divisiOptions} value={formData.divisi_pengirim_id} onChange={e => setFormData({...formData, divisi_pengirim_id: e.target.value})} placeholder="Pilih divisi pengirim" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Divisi Tujuan</label><Select options={tujuanDivisiOptions} value={formData.divisi_tujuan_id} onChange={e => setFormData({...formData, divisi_tujuan_id: e.target.value})} placeholder="Pilih divisi tujuan" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penerima (Opsional)</label><input type="text" name="nama_penerima" value={formData.nama_penerima} onChange={e => setFormData({...formData, nama_penerima: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">Batal</button><button type="submit" disabled={formLoading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">{formLoading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingSurat && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Edit Surat</h3>
              <button onClick={() => setEditingSurat(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20} /></button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perihal</label><textarea name="perihal" value={formData.perihal} onChange={e => setFormData({...formData, perihal: e.target.value})} rows={3} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" required /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Divisi Pengirim</label><Select options={divisiOptions} value={formData.divisi_pengirim_id} onChange={e => setFormData({...formData, divisi_pengirim_id: e.target.value})} placeholder="Pilih divisi pengirim" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Divisi Tujuan</label><Select options={tujuanDivisiOptions} value={formData.divisi_tujuan_id} onChange={e => setFormData({...formData, divisi_tujuan_id: e.target.value})} placeholder="Pilih divisi tujuan" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penerima</label><input type="text" name="nama_penerima" value={formData.nama_penerima} onChange={e => setFormData({...formData, nama_penerima: e.target.value})} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100" /></div>
              <div><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label><Select options={[{value:'draft',label:'Draft'},{value:'dikirim',label:'Sedang Dikirim'}]} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} placeholder="Pilih status" /></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingSurat(null)} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800">Batal</button><button type="submit" disabled={formLoading} className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md disabled:opacity-50">{formLoading ? 'Menyimpan...' : 'Simpan'}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!deleteTarget}
        title="Hapus Surat Ekspedisi"
        message={`Apakah Anda yakin ingin menghapus surat dengan nomor: ${deleteTarget?.nomor_surat}? Tindakan ini tidak dapat dibatalkan.`}
        type="alert"
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTarget(null)}
      />

      {/* Sync Confirmation Dialog */}
      <Dialog
        isOpen={!!syncTarget}
        title="Konfirmasi Sync (Diterima)"
        message="Apakah Anda yakin ingin mengubah status surat ini menjadi Sync (Diterima)? Setelah disinkronkan, surat ini akan bersifat PERMANEN dan tidak dapat diedit atau dihapus lagi."
        type="confirm"
        confirmText="Ya, Sinkronkan"
        cancelText="Batal"
        onConfirm={handleSyncConfirm}
        onClose={() => setSyncTarget(null)}
      />
      <FilterPopup
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setIsFilterOpen(false);
        }}
        divisiList={divisiList}
      />
    </div>
  );
}
