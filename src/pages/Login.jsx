import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from '@tanstack/react-router';
import { Mail01Icon, LockPasswordIcon, Building04Icon, UserIcon } from 'hugeicons-react';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [divisiList, setDivisiList] = useState([]);
  const [namaLengkap, setNamaLengkap] = useState('');

  const [email, setEmail] = useState('');
  const [kodeDivisi, setKodeDivisi] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch divisi list untuk register
  useEffect(() => {
    if (isRegister) {
      fetchDivisiList();
    }
  }, [isRegister]);

  const fetchDivisiList = async () => {
    try {
      const { data, error } = await api.getDivisi();
      if (error) throw new Error(error);
      setDivisiList(data || []);
    } catch (err) {
      console.error('Error fetching divisi:', err);
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        // Register flow (kurir self-registration)
        const { data, error } = await api.register(email, password, namaLengkap);

        if (error) throw new Error(error);

        // Show pending approval message
        setError('Registrasi berhasil! Menunggu persetujuan admin.');
        setLoading(false);
        return;
      } else {
        // Login flow - pass kode_divisi
        const { data, error } = await api.login(email, password, kodeDivisi || undefined);

        if (error) throw new Error(error);

        // Navigate based on role
        if (data.user.role === 'admin') {
          navigate({ to: '/admin/dashboard' });
        } else if (data.user.role === 'divisi') {
          navigate({ to: '/divisi/dashboard' });
        } else if (data.user.role === 'kurir') {
          navigate({ to: '/kurir/dashboard' });
        } else {
          throw new Error('Role tidak dikenali');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Building04Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              {isRegister ? 'Daftar Akun' : 'Manajemen Surat'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              {isRegister ? 'Registrasi akun kurir baru' : 'PT Timah - Sistem Ekspedisi Digital'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>

            {/* Nama Lengkap (register only) */}
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={namaLengkap}
                    onChange={(e) => setNamaLengkap(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="Nama lengkap"
                    required
                  />
                </div>
              </div>
            )}

            {/* Kode Divisi (login only, optional) */}
            {!isRegister && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kode Divisi <span className="text-slate-400 text-xs">(khusus divisi)</span>
                </label>
                <div className="relative">
                  <Building04Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={kodeDivisi}
                    onChange={(e) => setKodeDivisi(e.target.value.toUpperCase())}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors uppercase"
                    placeholder="KEU, SDM, IT, OPS"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Kosongkan jika login sebagai admin atau kurir
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Password
              </label>
              <div className="relative">
                <LockPasswordIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
            >
              {loading ? 'Memproses...' : isRegister ? 'Daftar' : 'Masuk'}
            </button>

            {/* Toggle Register/Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                  setKodeDivisi('');
                  setNamaLengkap('');
                }}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                {isRegister
                  ? 'Sudah memiliki akun? Masuk'
                  : 'Belum memiliki akun kurir? Daftar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
