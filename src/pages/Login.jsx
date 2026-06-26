import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from '@tanstack/react-router';
import { Mail01Icon, LockPasswordIcon, Building04Icon, UserIcon } from 'hugeicons-react';

export default function Login() {
  const [isDivisionLogin, setIsDivisionLogin] = useState(false);
  
  // Admin state
  const [email, setEmail] = useState('');
  
  // Divisi state
  const [kodeDivisi, setKodeDivisi] = useState('');
  const [nama, setNama] = useState('');
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Map Divisi inputs to a standard email format for Supabase Auth
    // Example: Kode="IT", Nama="Support" -> it_support@timah.com
    const emailToUse = isDivisionLogin 
      ? `${kodeDivisi.toLowerCase()}_${nama.toLowerCase().replace(/\s+/g, '')}@timah.com`
      : email;

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (authError) throw authError;

      // Fetch user role from public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', authData.user.id)
        .single();
        
      const userRole = userData?.role || (emailToUse.includes('admin') ? 'admin' : 'divisi');

      if (userRole === 'admin') {
        navigate({ to: '/admin/dashboard' });
      } else {
        navigate({ to: '/divisi/dashboard' });
      }
      
    } catch (err) {
      if (err.message.includes('Invalid login credentials')) {
        setError(isDivisionLogin 
          ? `Akun divisi belum terdaftar. Backend mencoba login dengan ID: ${emailToUse}` 
          : 'Gagal masuk. Periksa email dan password Anda.');
      } else {
        setError(err.message || 'Gagal masuk. Periksa data Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Surat Ekspedisi Digital</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Masuk ke sistem manajemen pengiriman</p>
          </div>

          {/* Toggle Login Mode */}
          <div className="flex p-1 mb-6 bg-slate-100 dark:bg-slate-900/50 rounded-lg">
            <button
              type="button"
              onClick={() => { setIsDivisionLogin(false); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                !isDivisionLogin 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => { setIsDivisionLogin(true); setError(null); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                isDivisionLogin 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
              }`}
            >
              Divisi
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {!isDivisionLogin ? (
              // Admin Email Field
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="email">
                  Email Admin
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail01Icon size={20} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="admin@timah.com"
                    required={!isDivisionLogin}
                  />
                </div>
              </div>
            ) : (
              // Divisi Fields
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="kodeDivisi">
                    Kode Divisi
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Building04Icon size={20} />
                    </div>
                    <input
                      id="kodeDivisi"
                      type="text"
                      value={kodeDivisi}
                      onChange={(e) => setKodeDivisi(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm uppercase"
                      placeholder="Contoh: IT"
                      required={isDivisionLogin}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="nama">
                    Nama
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <UserIcon size={20} />
                    </div>
                    <input
                      id="nama"
                      type="text"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                      placeholder="Nama Pengguna"
                      required={isDivisionLogin}
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <LockPasswordIcon size={20} />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Memproses...
                </span>
              ) : (isDivisionLogin ? 'Login Divisi' : 'Login Admin')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
