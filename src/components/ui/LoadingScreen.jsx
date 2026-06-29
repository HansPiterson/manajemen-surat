import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="flex flex-col items-center space-y-4 animate-fade-in">
        {/* Pulsing Logo */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-xl animate-pulse"></div>
          <img 
            src="https://res.cloudinary.com/dbdmoqrdj/image/upload/v1782649995/extension_icon_25_mkxpt2.webp" 
            alt="Logo E-Surat Digital" 
            className="w-28 h-28 object-contain relative animate-bounce"
            style={{ animationDuration: '2s' }}
          />
        </div>
        
        {/* Title */}
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-wider text-slate-800 dark:text-slate-200 uppercase">
            E-Surat Digital
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium tracking-widest">
            Sistem Manajemen Ekspedisi Surat
          </p>
        </div>

        {/* Loading Spinner Bar */}
        <div className="w-40 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-blue-600 rounded-full animate-[marquee_1.5s_infinite_linear]" style={{ width: '40%' }}></div>
        </div>
      </div>
    </div>
  );
}
