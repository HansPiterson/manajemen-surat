import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun01Icon, Moon02Icon, ComputerIcon } from 'hugeicons-react';

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Pengaturan</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Kelola preferensi akun dan tampilan aplikasi.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Tampilan (Appearance)</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Pilih tema warna yang paling nyaman untuk Anda gunakan.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun01Icon size={32} className="mb-3" />
                <span className="font-medium">Light Mode</span>
              </button>
              
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon02Icon size={32} className="mb-3" />
                <span className="font-medium">Dark Mode</span>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  theme === 'system' || !theme
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ComputerIcon size={32} className="mb-3" />
                <span className="font-medium">Sistem (Otomatis)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
