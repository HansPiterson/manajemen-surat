import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from '@tanstack/react-router';
import { formatDate } from '../../lib/utils';
import { api } from '../../lib/api';
import LoadingScreen from '../../components/ui/LoadingScreen';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Building,
  MapPin,
  Copy,
  Check,
  X,
  Eye,
} from 'lucide-react';

export default function SuratDetail() {
  const { nomorSurat } = useParams({ strict: false });
  const navigate = useNavigate();
  const [surat, setSurat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    fetchSurat();
  }, [nomorSurat]);

  const fetchSurat = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await api.getSuratByNomor(nomorSurat);
      if (err) throw new Error(err);
      setSurat(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <LoadingScreen />;

  if (error || !surat) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <FileText size={48} className="mx-auto text-slate-300 dark:text-slate-700 mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Surat Tidak Ditemukan
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
            {error || 'Surat dengan nomor tersebut tidak ditemukan'}
          </p>
          <button
            onClick={() => navigate({ to: '/admin/surat' })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto text-sm sm:text-base"
          >
            <ArrowLeft size={16} />
            Kembali ke Daftar Surat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="max-w-5xl mx-auto p-3 sm:p-4 md:p-6">
        {/* Back Button */}
        <button
          onClick={() => navigate({ to: '/admin/surat' })}
          className="mb-4 sm:mb-6 px-3 py-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={18} />
          Kembali
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950 rounded-lg shrink-0">
                <FileText size={20} className="text-blue-600 dark:text-blue-400 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 break-all">
                  <span className="break-all">{surat.nomor_surat}</span>
                  <button
                    onClick={() => handleCopy(surat.nomor_surat)}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
                    title="Salin Nomor Surat"
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                  <Calendar size={12} className="sm:w-3.5 sm:h-3.5" />
                  {formatDate(surat.tanggal_surat || surat.created_at)}
                </p>
              </div>
            </div>
            <span className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-semibold shrink-0 self-start sm:self-auto ${
              surat.status === 'draft'
                ? 'bg-gray-100 text-gray-700 ring-1 ring-inset ring-gray-500/10'
                : surat.status === 'dikirim'
                ? 'bg-yellow-50 text-yellow-800 ring-1 ring-inset ring-yellow-600/20'
                : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
            }`}>
              {surat.status === 'draft' ? 'Draft' : surat.status === 'dikirim' ? 'Sedang Dikirim' : 'Diterima'}
            </span>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-2">
              <User size={14} className="sm:w-4 sm:h-4" />
              Pengirim
            </div>
            <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 font-semibold break-words">
              {surat.pengirim_nama || '-'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-2">
              <Building size={14} className="sm:w-4 sm:h-4" />
              Tujuan
            </div>
            <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 font-semibold break-words">
              {surat.tujuan_nama || '-'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-2">
              <User size={14} className="sm:w-4 sm:h-4" />
              Penerima
            </div>
            <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 font-semibold break-words">
              {surat.nama_penerima || '-'}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mb-2">
              <User size={14} className="sm:w-4 sm:h-4" />
              Kurir
            </div>
            <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 font-semibold break-words">
              {surat.kurir_nama || '-'}
            </p>
          </div>
        </div>

        {/* Perihal */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Perihal</h3>
          <p className="text-sm sm:text-base text-slate-900 dark:text-slate-100 break-words">{surat.perihal}</p>
        </div>

        {/* Bukti Foto */}
        {surat.foto_bukti_url && (
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Bukti Pengiriman</h3>

            {/* Foto Preview */}
            <div className="mb-4 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
              <img
                src={surat.foto_bukti_url}
                alt="Bukti Pengiriman"
                className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxOpen(true)}
              />
            </div>

            {/* Lihat Foto Button */}
            <button
              onClick={() => setLightboxOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base mb-4"
            >
              <Eye size={18} />
              Lihat Foto
            </button>

            {/* GPS Info */}
            {surat.foto_latitude && surat.foto_longitude && (
              <div className="flex items-start gap-2 p-3 sm:p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <MapPin size={14} className="text-slate-400 shrink-0 mt-0.5 sm:w-4 sm:h-4" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Koordinat GPS</p>
                  <a
                    href={`https://www.google.com/maps?q=${surat.foto_latitude},${surat.foto_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono break-all"
                  >
                    {surat.foto_latitude}, {surat.foto_longitude}
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox */}
      {lightboxOpen && surat.foto_bukti_url && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
            aria-label="Close"
          >
            <X size={24} />
          </button>
          <img
            src={surat.foto_bukti_url}
            alt="Bukti Pengiriman"
            className="max-w-full max-h-full object-contain"
            onClick={() => setLightboxOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
