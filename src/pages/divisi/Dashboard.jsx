import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Skeleton from '../../components/ui/Skeleton';
import { InformationCircleIcon } from 'hugeicons-react';

export default function DivisiDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ masuk: 0, keluar: 0 });
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
        .select('divisi_tujuan_id, divisi_pengirim_id');
      
      if (statsError) throw statsError;
      
      setStats({ 
        masuk: allSurat?.length || 0, // Placeholder
        keluar: Math.floor((allSurat?.length || 0) / 2) // Placeholder
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Running Text Navbar (Marquee) */}
      <div className="bg-blue-600 dark:bg-blue-800 text-white flex items-center px-4 py-2.5 rounded-xl shadow-sm overflow-hidden relative -mt-2 mb-6">
        <InformationCircleIcon size={20} className="shrink-0 mr-3 text-blue-200" />
        <div className="flex-1 overflow-hidden relative" style={{ height: '24px' }}>
          <div className="animate-marquee absolute whitespace-nowrap text-sm font-medium">
            Informasi: Sebagai divisi, Anda hanya memiliki akses <strong>BACA (Read-Only)</strong> terhadap surat-surat yang dikirim ke divisi Anda atau dari divisi Anda. Pengunggahan foto bukti pengiriman dilakukan secara otomatis oleh kurir di lapangan melalui aplikasi mobile.
          </div>
        </div>
      </div>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Surat Masuk (Diterima)</h3>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mt-2">{stats.masuk}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Surat Keluar (Dikirim)</h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.keluar}</p>
          </div>
        </div>
      )}
    </div>
  );
}
