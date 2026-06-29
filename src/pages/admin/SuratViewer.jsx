import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import FilterPopup from '../../components/ui/FilterPopup';
import Select from '../../components/ui/Select';
import Dialog from '../../components/ui/Dialog';
import { 
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  Check, 
  FileText, 
  Image as ImageIcon, 
  MapPin, 
  ShieldCheck,
  Calendar,
  User,
  Building,
  Plus,
  Copy,
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
  const [copied, setCopied] = useState(false);
  
  // Modals state
  const [selectedSurat, setSelectedSurat] = useState(null); // For Details Popup
  const [editingSurat, setEditingSurat] = useState(null);   // For Edit Modal
  const [showCreateModal, setShowCreateModal] = useState(false); // For Create Modal
  const [deleteTarget, setDeleteTarget] = useState(null);   // For Custom Confirmation Dialog
  
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
    setCopied(false);
  }, [selectedSurat]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchSurat();
    fetchDivisi();
  }, []);

  const fetchDivisi = async () => {
    try {
      const { data, error } = await supabase
        .from('divisi')
        .select('id, nama_divisi')
        .eq('is_active', true);
      if (error) throw error;
      setDivisiList(data || []);
    } catch (err) {
      console.error('Error fetching divisi:', err);
    }
  };

  const fetchSurat = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('surat_ekspedisi')
        .select(`
          uuid, 
          nomor_surat, 
          perihal, 
          tanggal_surat, 
          status,
          foto_bukti_url,
          foto_latitude,
          foto_longitude,
          foto_hash,
          divisi_pengirim_id,
          divisi_tujuan_id,
          nama_penerima,
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

      const { error } = await supabase
        .from('surat_ekspedisi')
        .insert([{
          nomor_surat,
          perihal: formData.perihal,
          tanggal_surat: new Date(),
          status: formData.status,
          divisi_pengirim_id: formData.divisi_pengirim_id,
          divisi_tujuan_id: formData.divisi_tujuan_id,
          nama_penerima: formData.nama_penerima || null
        }]);
      
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('surat_ekspedisi')
        .update({
          perihal: formData.perihal,
          divisi_pengirim_id: formData.divisi_pengirim_id,
          divisi_tujuan_id: formData.divisi_tujuan_id,
          nama_penerima: formData.nama_penerima || null,
          status: formData.status,
          updated_at: new Date()
        })
        .eq('uuid', editingSurat.uuid);

      if (error) throw error;

      setEditingSurat(null);
      resetForm();
      fetchSurat();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleInlineStatusChange = async (uuid, newStatus) => {
    try {
      const { error } = await supabase
        .from('surat_ekspedisi')
        .update({ 
          status: newStatus, 
          updated_at: new Date() 
        })
        .eq('uuid', uuid);

      if (error) throw error;
      
      setSuratList(prev => prev.map(item => 
        item.uuid === uuid ? { ...item, status: newStatus } : item
      ));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      const { error } = await supabase
        .from('surat_ekspedisi')
        .delete()
        .eq('uuid', deleteTarget.uuid);

      if (error) throw error;
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
    label: div.nama_divisi
  }));

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
      const diff = new Date(b.tanggal_surat) - new Date(a.tanggal_surat);
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
                  return (
                  <tr key={surat.uuid} className={`transition-all duration-1000 ease-in-out ${isHighlight ? 'bg-blue-600 dark:bg-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                    <td className={`px-6 py-4 text-sm font-medium transition-colors duration-1000 ${isHighlight ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`} title={surat.nomor_surat}>
                      {truncateText(surat.nomor_surat, 12)}
                    </td>
                    <td className={`px-6 py-4 text-sm transition-colors duration-1000 ${isHighlight ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`} title={surat.divisi_pengirim?.nama_divisi || '-'}>
                      {truncateText(surat.divisi_pengirim?.nama_divisi || '-', 15)}
                    </td>
                    <td className={`px-6 py-4 text-sm transition-colors duration-1000 ${isHighlight ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`} title={surat.divisi_tujuan?.nama_divisi || '-'}>
                      {truncateText(surat.divisi_tujuan?.nama_divisi || '-', 15)}
                    </td>
                    <td className={`px-6 py-4 text-sm max-w-xs truncate transition-colors duration-1000 ${isHighlight ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`} title={surat.perihal}>
                      {truncateText(surat.perihal, 20)}
                    </td>
                    <td className={`px-6 py-4 text-sm transition-colors duration-1000 ${isHighlight ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}`}>{surat.tanggal_surat}</td>
                    <td className="px-6 py-4 text-sm">
                      {/* Custom Select Component for Status */}
                      <Select
                        value={surat.status}
                        onChange={(e) => handleInlineStatusChange(surat.uuid, e.target.value)}
                        options={statusOptions}
                        className={
                          surat.status === 'draft' 
                            ? '!bg-slate-50 dark:!bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold'
                            : surat.status === 'dikirim'
                            ? '!bg-yellow-50/50 dark:!bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/40 text-yellow-800 dark:text-yellow-400 font-semibold'
                            : '!bg-blue-50/50 dark:!bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-400 font-semibold'
                        }
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Preview / Detail Icon */}
                        <button 
                          onClick={() => setSelectedSurat(surat)}
                          className="text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Preview Detail Surat"
                        >
                          <Eye size={18} />
                        </button>
                        {/* Edit Icon */}
                        <button 
                          onClick={() => handleEditClick(surat)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                          title="Edit Surat"
                        >
                          <Pencil size={18} />
                        </button>
                        {/* Delete Icon */}
                        <button 
                          onClick={() => setDeleteTarget({ uuid: surat.uuid, nomor_surat: surat.nomor_surat })}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                          title="Hapus Surat"
                        >
                          <Trash2 size={18} />
                        </button>
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

      {/* Detail & Preview Modal */}
      {selectedSurat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <FileText size={20} className="text-slate-500" />
                Detail Surat Ekspedisi
              </h3>
              <button 
                onClick={() => setSelectedSurat(null)}
                className="text-slate-505 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nomor Surat</p>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedSurat.nomor_surat}</p>
                    <button
                      onClick={() => handleCopy(selectedSurat.nomor_surat)}
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                      title="Salin Nomor Surat"
                    >
                      {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tanggal Pembuatan</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(selectedSurat.tanggal_surat).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Divisi Pengirim</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Building size={14} className="text-slate-400" />
                    {selectedSurat.divisi_pengirim?.nama_divisi || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Divisi Tujuan</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Building size={14} className="text-slate-400" />
                    {selectedSurat.divisi_tujuan?.nama_divisi || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Nama Penerima / Kurir</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <User size={14} className="text-slate-400" />
                    {selectedSurat.nama_penerima || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Status Surat</p>
                  <div>
                    {selectedSurat.status === 'draft' && <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-500/10">Draft</span>}
                    {selectedSurat.status === 'dikirim' && <span className="inline-flex items-center rounded-md bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">Sedang Dikirim</span>}
                    {selectedSurat.status === 'diterima' && <span className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-600/20">Sync (Diterima)</span>}
                  </div>
                </div>
              </div>

              <div className="space-y-1 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">Perihal</p>
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">{selectedSurat.perihal}</p>
              </div>

              {/* Photo Proof Section (If Available) */}
              {selectedSurat.foto_bukti_url ? (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">Bukti Pengiriman Fisik</h4>
                  
                  <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/40 rounded-lg">
                    <ShieldCheck className="text-green-600 dark:text-green-400" size={20} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-green-800 dark:text-green-400">Hash Anti-Tampering Valid</p>
                      <p className="text-[10px] text-green-700 dark:text-green-500 font-mono truncate">{selectedSurat.foto_hash}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden aspect-[4/3] flex items-center justify-center">
                      <img 
                        src={selectedSurat.foto_bukti_url} 
                        alt="Bukti Pengiriman" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80";
                        }}
                      />
                    </div>
                    <div className="space-y-3 flex flex-col justify-center bg-slate-50 dark:bg-slate-850 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="flex items-start gap-2">
                        <MapPin size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Geotagging Lokasi</p>
                          {selectedSurat.foto_latitude && selectedSurat.foto_longitude ? (
                            <a 
                              href={`https://www.google.com/maps?q=${selectedSurat.foto_latitude},${selectedSurat.foto_longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs font-mono text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 mt-0.5"
                            >
                              Buka di Google Maps ↗
                            </a>
                          ) : (
                            <p className="text-xs font-mono text-slate-800 dark:text-slate-200">
                              Belum ada data GPS
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Waktu Pengambilan</p>
                          <p className="text-xs text-slate-800 dark:text-slate-200">
                            {new Date(selectedSurat.tanggal_surat).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-center py-4 bg-slate-50 dark:bg-slate-800/20 rounded-lg">
                  <ImageIcon size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada bukti foto yang di-upload dari aplikasi kurir.</p>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Edit Surat Modal */}
      {editingSurat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-scale-up">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Edit Detail Surat</h3>
              <button 
                onClick={() => setEditingSurat(null)}
                className="text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Perihal Surat *</label>
                <input
                  type="text"
                  name="perihal"
                  value={formData.perihal}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Divisi Pengirim *</label>
                  <Select
                    value={formData.divisi_pengirim_id}
                    onChange={(e) => handleSelectChange('divisi_pengirim_id', e.target.value)}
                    options={divisiOptions}
                    placeholder="Pilih divisi pengirim"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Divisi Tujuan *</label>
                  <Select
                    value={formData.divisi_tujuan_id}
                    onChange={(e) => handleSelectChange('divisi_tujuan_id', e.target.value)}
                    options={divisiOptions}
                    placeholder="Pilih divisi tujuan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Penerima / Kurir</label>
                  <input
                    type="text"
                    name="nama_penerima"
                    value={formData.nama_penerima}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Nama Penerima"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status Surat *</label>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleSelectChange('status', e.target.value)}
                    options={statusOptions}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingSurat(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Surat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-scale-up">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Buat Surat Ekspedisi Baru</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-550 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={22} />
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
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="Misal: Pengiriman Dokumen Kontrak"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Divisi Pengirim *</label>
                  <Select
                    value={formData.divisi_pengirim_id}
                    onChange={(e) => handleSelectChange('divisi_pengirim_id', e.target.value)}
                    options={divisiOptions}
                    placeholder="Pilih divisi pengirim"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Divisi Tujuan *</label>
                  <Select
                    value={formData.divisi_tujuan_id}
                    onChange={(e) => handleSelectChange('divisi_tujuan_id', e.target.value)}
                    options={divisiOptions}
                    placeholder="Pilih divisi tujuan"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nama Penerima</label>
                  <input
                    type="text"
                    name="nama_penerima"
                    value={formData.nama_penerima}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-650 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="Biasanya diisi kurir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Status Awal *</label>
                  <Select
                    value={formData.status}
                    onChange={(e) => handleSelectChange('status', e.target.value)}
                    options={statusOptions}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reusable Custom Confirmation Dialog */}
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
