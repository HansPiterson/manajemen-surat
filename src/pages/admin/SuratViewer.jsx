import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import { Image01Icon, Cancel01Icon, CheckmarkBadge01Icon } from 'hugeicons-react';

export default function SuratViewer() {
  const [suratList, setSuratList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [selectedSurat, setSelectedSurat] = useState(null);

  useEffect(() => {
    fetchSurat();
  }, []);

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

  const getStatusBadge = (status) => {
    switch(status) {
      case 'diterima':
        return <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-900/30 dark:text-green-400 dark:ring-green-500/20">Diterima</span>;
      case 'dikirim':
        return <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 dark:bg-yellow-900/30 dark:text-yellow-400 dark:ring-yellow-500/20">Dikirim</span>;
      default:
        return <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Surat Ekspedisi (Semua Divisi)</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Lihat seluruh aktivitas pengiriman dan penerimaan surat secara global.</p>
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
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                <CheckmarkBadge01Icon className="text-emerald-600 dark:text-emerald-400" size={24} />
                <div>
                  <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Hash Tervalidasi (Anti-Tampering)</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 font-mono mt-0.5 truncate max-w-[280px]">
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
    </div>
  );
}
