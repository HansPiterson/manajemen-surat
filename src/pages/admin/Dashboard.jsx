import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import Select from '../../components/ui/Select';
import { Link } from '@tanstack/react-router';
import { Eye } from 'lucide-react';

const truncateText = (text, maxLength = 12) => {
  if (!text) return '-';
  return text.length > maxLength ? text.slice(0, maxLength) + '..' : text;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, draft: 0, dikirim: 0, diterima: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Stats
      // Instead of 3 separate count queries which can be slow, we'll fetch all statuses and count them in memory
      // Note: for very large datasets, use separate count queries with { count: 'exact', head: true }
      const { data: allSurat, error: statsError } = await supabase
        .from('surat_ekspedisi')
        .select('status');
      
      if (statsError) throw statsError;

      const total = allSurat?.length || 0;
      const draft = allSurat?.filter(s => s.status === 'draft').length || 0;
      const dikirim = allSurat?.filter(s => s.status === 'dikirim').length || 0;
      const diterima = allSurat?.filter(s => s.status === 'diterima').length || 0;

      setStats({ total, draft, dikirim, diterima });

      // 2. Fetch Recent Activity (Limit 5)
      const { data: recent, error: recentError } = await supabase
        .from('surat_ekspedisi')
        .select(`
          uuid, 
          nomor_surat, 
          perihal, 
          tanggal_surat, 
          status,
          divisi_pengirim:divisi_pengirim_id (nama_divisi),
          divisi_tujuan:divisi_tujuan_id (nama_divisi)
        `)
        .order('tanggal_surat', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;
      setRecentActivity(recent || []);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
      
      // Update local state first for instant feedback, then refetch stats asynchronously
      setRecentActivity(prev => prev.map(item => 
        item.uuid === uuid ? { ...item, status: newStatus } : item
      ));
      
      // Fetch stats again to update the card numbers
      const { data: allSurat } = await supabase
        .from('surat_ekspedisi')
        .select('status');
      if (allSurat) {
        const total = allSurat.length;
        const draft = allSurat.filter(s => s.status === 'draft').length;
        const dikirim = allSurat.filter(s => s.status === 'dikirim').length;
        const diterima = allSurat.filter(s => s.status === 'diterima').length;
        setStats({ total, draft, dikirim, diterima });
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Dashboard Overview</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Ringkasan aktivitas surat ekspedisi digital hari ini.</p>
      </div>

      {error && (
        <div className="mb-4 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Surat Tercatat</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Surat Draft</h3>
            <p className="text-3xl font-bold text-gray-500 dark:text-gray-400 mt-2">{stats.draft}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Sedang Dikirim</h3>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.dikirim}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Surat Sync</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.diterima}</p>
          </div>
        </div>
      )}

      {/* Recent Activity Table */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Aktivitas Terbaru</h2>
        {loading ? (
          <div className="space-y-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
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
                  {recentActivity.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                        Belum ada aktivitas yang tercatat.
                      </td>
                    </tr>
                  ) : (
                    recentActivity.map((surat) => (
                      <tr key={surat.uuid} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900 dark:text-slate-100" title={surat.nomor_surat}>
                          {truncateText(surat.nomor_surat, 12)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300" title={surat.divisi_pengirim?.nama_divisi || '-'}>
                          {truncateText(surat.divisi_pengirim?.nama_divisi || '-', 15)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300" title={surat.divisi_tujuan?.nama_divisi || '-'}>
                          {truncateText(surat.divisi_tujuan?.nama_divisi || '-', 15)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-slate-100 max-w-xs truncate" title={surat.perihal}>
                          {truncateText(surat.perihal, 20)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{surat.tanggal_surat}</td>
                        <td className="px-6 py-4 text-sm w-48">
                          <Select
                            value={surat.status}
                            onChange={(e) => handleInlineStatusChange(surat.uuid, e.target.value)}
                            options={[
                              { value: 'draft', label: 'Draft' },
                              { value: 'dikirim', label: 'Dikirim' },
                              { value: 'diterima', label: 'Sync (Diterima)' }
                            ]}
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
                          <Link 
                            to="/admin/surat" 
                            className="inline-flex items-center justify-center text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            title="Buka Halaman Surat Ekspedisi"
                          >
                            <Eye size={18} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
