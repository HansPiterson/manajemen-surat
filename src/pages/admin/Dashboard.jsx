import React, { useState, useEffect } from 'react';
import { formatDate } from '../../lib/utils';
import { api } from '../../lib/api';
import Skeleton from '../../components/ui/Skeleton';
import Select from '../../components/ui/Select';
import { useNavigate } from '@tanstack/react-router';
import { Eye, Truck, Building2 } from 'lucide-react';

const truncateText = (text, maxLength = 12) => {
  if (!text) return '-';
  return text.length > maxLength ? text.slice(0, maxLength) + '..' : text;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, draft: 0, dikirim: 0, diterima: 0, kurir_aktif: 0, total_divisi: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: apiError } = await api.getDashboard();
      if (apiError) throw new Error(apiError);
      setStats(data.stats ?? { total: 0, draft: 0, dikirim: 0, diterima: 0, kurir_aktif: 0, total_divisi: 0 });
      setRecentActivity(data.recentActivity ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Ringkasan aktivitas surat ekspedisi</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400">Total Surat</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400">Draft</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.draft}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400">Dikirim</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.dikirim}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="text-sm text-slate-500 dark:text-slate-400">Diterima</div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.diterima}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Truck size={14} className="shrink-0" /> Kurir Aktif
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.kurir_aktif}</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <Building2 size={14} className="shrink-0" /> Total Divisi
          </div>
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.total_divisi}</div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Aktivitas Terbaru</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">No. Surat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Perihal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pengirim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tujuan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {recentActivity.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    Belum ada aktivitas
                  </td>
                </tr>
              ) : (
                recentActivity.map((surat) => (
                  <tr key={surat.uuid} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-50">{surat.nomor_surat}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-50">{truncateText(surat.perihal, 30)}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{surat.pengirim_nama}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{surat.tujuan_nama}</td>
                    <td className="px-6 py-4">
                      <Select
                        value={surat.status}
                        options={[
                          { value: 'draft', label: 'Draft' },
                          { value: 'dikirim', label: 'Dikirim' },
                          { value: 'diterima', label: 'Diterima' },
                        ]}
                        onChange={() => {}}
                        disabled
                      />
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          sessionStorage.setItem('highlightSuratId', surat.uuid);
                          navigate({ to: '/admin/surat' });
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
