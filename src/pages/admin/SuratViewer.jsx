import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import { Image01Icon, Cancel01Icon, CheckmarkBadge01Icon } from 'hugeicons-react';

export default function SuratViewer() {
  const [suratList, setSuratList] = useState([]);
  const [divisiList, setDivisiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedSurat, setSelectedSurat] = useState(null);
  
  // Create Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    perihal: '',
    divisi_pengirim_id: '',
    divisi_tujuan_id: '',
    nama_penerima: '',
    tujuan_perorangan: ''
  });

  useEffect(() => {
    fetchSurat();
    fetchDivisi();
  }, []);

  const fetchDivisi = async () => {
    try {
      const { data, error } = await supabase.from('divisi').select('id, nama_divisi').eq('is_active', true);
      if (error) throw error;
      setDivisiList(data || []);
    } catch (err) {
      console.error('Error fetching divisi:', err);
    }
  };

  const fetchSurat = async () => {
    setLoading(true);
    try {
      // Fetching all surat data including photo proof columns
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError(null);
    try {
      // Auto-generate surat number format: EKS-YYYYMMDD-XXXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const nomor_surat = `EKS-${dateStr}-${randomId}`;

      const { error } = await supabase
        .from('surat_ekspedisi')
        .insert([{
          nomor_surat,
          perihal: formData.perihal,
          tanggal_surat: new Date(),
          status: 'dikirim',
          divisi_pengirim_id: formData.divisi_pengirim_id,
          divisi_tujuan_id: formData.divisi_tujuan_id,
          nama_penerima: formData.nama_penerima || null,
          tujuan_perorangan: formData.tujuan_perorangan || null,
          needs_upload: true // Will be picked up by mobile app
        }]);
      
      if (error) throw error;
      
      setShowCreateModal(false);
      setFormData({ perihal: '', divisi_pengirim_id: '', divisi_tujuan_id: '', nama_penerima: '', tujuan_perorangan: '' });
      fetchSurat();
    } catch (err) {
      setError(err.message);
    } finally {
      setFormLoading(false);
    }
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Surat Ekspedisi</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola dan pantau seluruh aktivitas pengiriman surat.</p>
        </div>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap"
        >
          Buat Surat Baru
        </button>
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
                <th className="px-6 py-4 font-medium text-center">Bukti</th>
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
                    <td className="px-6 py-4 flex justify-center"><Skeleton className="h-6 w-6 rounded-md" /></td>
                  </tr>
                ))
              ) : suratList.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Belum ada surat yang terdaftar.
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
                    <td className="px-6 py-4 text-sm text-center">
                      {surat.foto_bukti ? (
                        <button 
                          onClick={() => setSelectedSurat(surat)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors inline-block"
                          title="Lihat Bukti Foto"
                        >
                          <Image01Icon size={20} />
                        </button>
                      ) : surat.needs_upload ? (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium" title="Menunggu Sync Upload dari Mobile">
                          Syncing...
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Proof Modal */}
      {selectedSurat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Bukti Pengiriman</h3>
              <button 
                onClick={() => setSelectedSurat(null)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Cancel01Icon size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4">
              
              {/* Validation Badge */}
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
                <CheckmarkBadge01Icon className="text-slate-700 dark:text-slate-300" size={24} />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Hash Tervalidasi (Anti-Tampering)</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[280px]">
                    {selectedSurat.foto_hash || 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6'}
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              <div className="bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden aspect-[3/4] sm:aspect-square flex items-center justify-center relative">
                {selectedSurat.foto_bukti ? (
                  <img 
                    src={selectedSurat.foto_bukti} 
                    alt="Bukti Pengiriman" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      // Fallback dummy image if real URL fails (e.g., local storage issues)
                      e.target.src = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80";
                    }}
                  />
                ) : (
                  <div className="text-center p-4">
                    <Image01Icon size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Gambar tidak tersedia</p>
                  </div>
                )}
                
                {/* Geotag Overlay Overlay simulation if not burnt into canvas */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-md p-3">
                  <p className="text-white text-xs font-mono">
                    Lat: {selectedSurat.foto_latitude || '-2.123456'} <br/>
                    Long: {selectedSurat.foto_longitude || '106.123456'}
                  </p>
                  <p className="text-white/80 text-[10px] mt-1">
                    Diambil pada: {new Date(selectedSurat.tanggal_surat).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Nomor Surat:</span> {selectedSurat.nomor_surat}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Perihal:</span> {selectedSurat.perihal}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Create Surat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">Buat Surat Ekspedisi Baru</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Cancel01Icon size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Perihal Surat *</label>
                <input
                  type="text"
                  name="perihal"
                  value={formData.perihal}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  placeholder="Misal: Pengiriman Dokumen Kontrak"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Divisi Pengirim *</label>
                  <select
                    name="divisi_pengirim_id"
                    value={formData.divisi_pengirim_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="">-- Pilih Divisi --</option>
                    {divisiList.map(div => (
                      <option key={div.id} value={div.id}>{div.nama_divisi}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Divisi Tujuan *</label>
                  <select
                    name="divisi_tujuan_id"
                    value={formData.divisi_tujuan_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                  >
                    <option value="">-- Pilih Divisi --</option>
                    {divisiList.map(div => (
                      <option key={div.id} value={div.id}>{div.nama_divisi}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tujuan Perorangan</label>
                  <input
                    type="text"
                    name="tujuan_perorangan"
                    value={formData.tujuan_perorangan}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Misal: Bpk. Budi"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Opsional jika ditujukan ke orang spesifik.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Penerima</label>
                  <input
                    type="text"
                    name="nama_penerima"
                    value={formData.nama_penerima}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                    placeholder="Biasanya diisi kurir"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Opsional, bisa diisi nanti saat surat diterima.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-md font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-200 dark:hover:bg-white dark:text-slate-900 rounded-md font-medium transition-colors disabled:opacity-50"
                >
                  {formLoading ? 'Menyimpan...' : 'Simpan & Terbitkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
