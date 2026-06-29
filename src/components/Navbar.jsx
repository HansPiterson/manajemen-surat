import React, { useState } from 'react';
import { Menu01Icon, ArrowExpandIcon, ArrowShrinkIcon } from 'hugeicons-react';

export default function Navbar({ onMenuClick, hideProfile, onToggleFullscreen, isFullscreen, className = '' }) {
  return (
    <header className={`sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 transition-all ${className}`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <Menu01Icon size={24} />
        </button>
        
        <div className="flex items-center gap-3">
          <img 
            src="https://upload.wikimedia.org/wikipedia/id/thumb/4/40/Timah_Logo1.png/1280px-Timah_Logo1.png" 
            alt="Logo PT Timah" 
            className="h-6 sm:h-8 w-auto object-contain shrink-0"
          />
          <div className="flex flex-col min-w-0">
            <h1 className="text-sm md:text-lg font-bold leading-tight text-slate-900 dark:text-slate-50 truncate">
              Surat Ekspedisi Digital
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400 truncate">
                Server: Online
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {onToggleFullscreen && (
          <button 
            onClick={onToggleFullscreen}
            className="p-2 rounded-md text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors hidden sm:block"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <ArrowShrinkIcon size={20} /> : <ArrowExpandIcon size={20} />}
          </button>
        )}
      </div>
    </header>
  );
}
