import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import { InformationCircleIcon } from 'hugeicons-react';

export default function DivisiDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0 });
  const [namaDivisi, setNamaDivisi] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch session to get user ID
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (session?.user) {
        // Fetch division name for the title
        const { data: userData } = await supabase
          .from('users')
          .select(`
            divisi:divisi_id (nama_divisi)
          `)
          .eq('id', session.user.id)
          .single();
          
        if (userData?.divisi?.nama_divisi) {
          setNamaDivisi(userData.divisi.nama_divisi);
        }
      }

      // Fetch stats
      const { data: allSurat, error: statsError } = await supabase
        .from('surat_ekspedisi')
        .select('tanggal_surat, status');
      
      if (statsError) throw statsError;
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      let todayCount = 0;
      let weekCount = 0;
      let monthCount = 0;

      (allSurat || []).forEach(surat => {
        const d = new Date(surat.tanggal_surat);
        if (d >= today) todayCount++;
        if (d >= firstDayOfWeek) weekCount++;
        if (d >= firstDayOfMonth) monthCount++;
      });
      
      setStats({ 
        today: todayCount,
        week: weekCount,
        month: monthCount,
        total: allSurat?.length || 0
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Dashboard Divisi {namaDivisi ? `(${namaDivisi})` : ''}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Pantau surat masuk dan keluar khusus untuk divisi Anda.</p>
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
    </div>
  );
}
