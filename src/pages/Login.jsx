import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from '@tanstack/react-router';
import { Mail01Icon, LockPasswordIcon, Building04Icon, UserIcon } from 'hugeicons-react';
import LoadingScreen from '../components/ui/LoadingScreen';

export default function Login() {
const [isDivisionLogin, setIsDivisionLogin] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [divisiList, setDivisiList] = useState([]);
  const [selectedDivisiId, setSelectedDivisiId] = useState('');
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
        // Register flow
        const { data, error } = await api.register(
    email,
     password,
      namaLengkap,
          kodeDivisi
        );

     if (error) throw new Error(error);

// Navigate based on role
        if (data.user.role === 'admin') {
          navigate({ to: '/admin/dashboard' });
        } else if (data.user.role === 'divisi') {
          navigate({ to: '/divisi/dashboard' });
        }
      } else {
        // Login flow
        const { data, error } = await api.login(email, password);

        if (error) throw new Error(error);

// Navigate based on role
    if (data.user.role === 'admin') {
          navigate({ to: '/admin/dashboard' });
        } else if (data.user.role === 'divisi') {
          navigate({ to: '/divisi/dashboard' });
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
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8">
          {/* Header */}
      <div className="text-center mb-8">
    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
  <Building04Icon className="w-8 h-8 text-white" />
            </div>
   <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
    {isRegister ? 'Registrasi' : 'Selamat Datang'}
         </h1>
         <p className="text-slate-600 dark:text-slate-400 mt-2">
    {isRegister 
     ? 'Buat akun baru untuk divisi' 
  : 'Masuk ke sistem manajemen surat'}
         </p>
       </div>

          {/* Error message */}
    {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
     <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
  </div>
    )}

          {/* Login/Register Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
{isRegister && (
              <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        Nama Lengkap
        </label>
                <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
           <UserIcon className="h-5 w-5 text-slate-400" />
</div>
    <input
 type="text"
             value={namaLengkap}
    onChange={(e) => setNamaLengkap(e.target.value)}
     className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    placeholder="Masukkan nama lengkap"
    required
    />
    </div>
        </div>
            )}

     <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
   Email
    </label>
              <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Mail01Icon className="h-5 w-5 text-slate-400" />
         </div>
      <input
                  type="email"
        value={email}
      onChange={(e) => setEmail(e.target.value)}
      className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          placeholder="nama@email.com"
         required
            />
      </div>
     </div>

            {isRegister && (
  <div>
     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
           Kode Divisi
      </label>
   <div className="relative">
   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
     <Building04Icon className="h-5 w-5 text-slate-400" />
          </div>
     <input
     type="text"
   value={kodeDivisi}
onChange={(e) => setKodeDivisi(e.target.value)}
        className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
        placeholder="Contoh: IT, HR, FIN"
           required
       />
                </div>
      </div>
       )}

            <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
         Password
    </label>
              <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <LockPasswordIcon className="h-5 w-5 text-slate-400" />
      </div>
      <input
      type="password"
   value={password}
      onChange={(e) => setPassword(e.target.value)}
       className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
       }}
 className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
   >
             {isRegister
    ? 'Sudah memiliki akun? Masuk'
             : 'Belum memiliki akun? Daftar'}
        </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
